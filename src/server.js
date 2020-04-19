require('dotenv').config();
const os = require('os');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const { exec } = require('child_process');
const { check, validationResult } = require('express-validator');
const app = require('./config/express');
const { PORT, ENV, APP_DIR } = require('./config');
const buildServerApi = require('./services/build-server-api.service');
const retry = require('./helpers/retry');
const git = require('./helpers/git');

const TMP_DIR = path.join(APP_DIR, 'tmp');
const registerAgentRetry = retry(buildServerApi.notifyAgent, -1, 1000);
const sendBuildResultRetry = retry(buildServerApi.notifyBuildResult, 4, 1000, true);

function clearTmpDirSync() {
  if (fs.existsSync(TMP_DIR)) {
    try {
      rimraf.sync(TMP_DIR);
    } catch (error) {
      console.error('Error rm -rf tmp dir', TMP_DIR, error);
    }
  }

  fs.mkdirSync(TMP_DIR);
}

function init() {
  const HOST = 'http://localhost';

  registerAgentRetry(HOST, PORT)
    .then(() => {
      if (ENV === 'dev') {
        console.log('--REGISTER AGENT--');
      }
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

    clearTmpDirSync();

    try {
      if (ENV === 'dev') {
        console.log('--GIT COMMANDS--');
      }

      await git.clone(repoName, TMP_DIR);
      await git.checkout(commitHash, TMP_DIR);
    } catch (error) {
      console.error('ERROR git', error);
    }

    try {
      if (ENV === 'dev') {
        console.log('--RUN COMMAND--', buildCommand);
      }

      const startBuild = new Date();
      // yarn install && yarn test --watchAll=false --color=always
      exec(buildCommand, { cwd: TMP_DIR }, async (error, stdout, stderr) => {
        const buildLog = stdout + stderr;
        const status = !error;
        const duration = new Date() - startBuild;
        sendBuildResultRetry(agentId, id, duration, buildLog, status);
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
