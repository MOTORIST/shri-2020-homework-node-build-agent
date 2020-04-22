require('dotenv').config();
const dockerCompose = require('docker-compose');
const path = require('path');
const { check, validationResult } = require('express-validator');
const app = require('./config/express');
const { PORT, HOST, ENV, CONTAINER_NAME } = require('./config');
const buildServerApi = require('./services/build-server-api.service');
const retry = require('./helpers/retry');

const registerAgentRetry = retry(buildServerApi.notifyAgent, -1, 1000);
const sendBuildResultRetry = retry(buildServerApi.notifyBuildResult, 4, 1000, true);
const debugMessage = (...args) => ENV === 'dev' && console.log(...args);

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

    const DIR = path.join('tmp', repoName);
    let buildLog = '--EMPTY--';
    let status = false;
    let duration = 1;

    try {
      debugMessage('---RM CONTAINER---');
      await dockerCompose.rm({ commandOptions: ['-s'] });
    } catch (error) {
      console.log(`ERROR FORCE RM ${CONTAINER_NAME}`, error);
    }

    try {
      debugMessage('---UP CONTAINER---');
      await dockerCompose.upAll();
    } catch (error) {
      console.log(`ERROR UP ${CONTAINER_NAME}`, error);
    }

    try {
      debugMessage('---CLONE REPO---');
      const repo = `https://github.com/${repoName}.git`;
      await dockerCompose.exec(CONTAINER_NAME, `git clone ${repo} ${DIR}`);
    } catch (error) {
      console.log(`ERROR CLONE ${repoName}`, error);
    }

    try {
      debugMessage('---CHECKOUT---');
      await dockerCompose.exec(CONTAINER_NAME, [
        '/bin/bash',
        '-c',
        `cd ${DIR} && git checkout ${commitHash}`,
      ]);
    } catch (error) {
      console.log(`ERROR CHECKOUT REPO ${repoName} COMMIT HASH ${commitHash}`, error);
    }

    try {
      debugMessage('---RUN COMMAND---');
      const startRunCommand = new Date();
      const { out, err, exitCode } = await dockerCompose.exec(CONTAINER_NAME, [
        '/bin/bash',
        '-c',
        `cd ${DIR} && ${buildCommand}`,
      ]);

      buildLog = out + err;
      status = exitCode === 0;
      duration = new Date() - startRunCommand;
    } catch (error) {
      console.log(`ERROR RUN BUILD COMMAND ${buildCommand}`, error);
    }

    try {
      debugMessage('---SEND RESULT---');
      await sendBuildResultRetry(agentId, id, duration, buildLog, status);
      debugMessage('---FINISH---');
    } catch (error) {
      console.log('ERROR SEND RESULT BUILD', error);
    }

    return res.json({ data: req.body });
  },
);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Agent server started on port ${PORT} - env (${ENV})`);
});
