require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { check, validationResult } = require('express-validator');
const app = require('./config/express');
const { PORT, HOST, ENV, APP_DIR } = require('./config');
const buildServerApi = require('./services/build-server-api.service');
const retry = require('./helpers/retry');
const git = require('./helpers/git');
const { createDir, removeDir } = require('./helpers');

const TMP_DIR = path.join(APP_DIR, 'tmp');
const registerAgentRetry = retry(buildServerApi.notifyAgent, -1, 1000);
const sendBuildResultRetry = retry(buildServerApi.notifyBuildResult, 4, 1000, true);
const debugMessage = (...args) => ENV === 'dev' && console.log(...args);

async function clearTmpDir() {
  if (fs.existsSync(TMP_DIR)) {
    await removeDir(TMP_DIR);
    await createDir(TMP_DIR);
  }
}

function init() {
  registerAgentRetry(HOST, PORT)
    .then(() => {
      debugMessage('--REGISTER AGENT--');
    })
    .catch(console.error);
}

init();

app.get('/', (req, res) => res.json({ ok: true }));

app.post(
  '/build',
  [
    check('agentId').isString().exists(),
    check('id').isString().exists(),
    check('commitHash').isString().exists(),
    check('buildCommand').isString().exists(),
    check('repoName').isString().exists(),
  ],
  async (req, res) => {
    const { agentId, id, commitHash, buildCommand, repoName } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      debugMessage('--START CLEANING DIRECTORY--');
      await clearTmpDir();
      debugMessage('--END CLEANING DIRECTORY--');
    } catch (error) {
      console.error('ERROR CLEAR TMP DIRECTORY', TMP_DIR, error);
    }

    try {
      debugMessage('--GIT COMMANDS--');
      await git.clone(repoName, TMP_DIR);
      await git.checkout(commitHash, TMP_DIR);
    } catch (error) {
      console.error('ERROR git', error);
    }

    try {
      debugMessage('--RUN COMMAND--', buildCommand);
      const startBuild = new Date();
      // yarn install && yarn test --watchAll=false --color=always

      exec(buildCommand, { cwd: TMP_DIR }, async (error, stdout, stderr) => {
        const buildLog = stdout + stderr;
        const status = !error;
        const duration = new Date() - startBuild;
        debugMessage('--FINISH COMMAND--', buildCommand);
        debugMessage('--SEND BUILD RESULT TO SERVER--');
        await sendBuildResultRetry(agentId, id, duration, buildLog, status);
        debugMessage('--FINISH SEND BUILD RESULT TO SERVER--');
      });
    } catch (error) {
      console.log(error);
    }

    return res.json({ data: req.body });
  },
);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Agent server started on port ${PORT} - env (${ENV})`);
});
