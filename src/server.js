require('dotenv').config();
const app = require('./config/express');
const { PORT, ENV, SERVER_HOST, SERVER_PORT } = require('./config');
const buildServerApi = require('./services/build-server-api.service');
const retry = require('./helpers/retry');

const registerAgentRetry = retry(buildServerApi.notifyAgent, -1, 1000);

function init() {
  registerAgentRetry(SERVER_HOST, SERVER_PORT)
    .then(() => {
      if (ENV === 'dev') {
        console.log('--REGISTER AGENT--');
      }
    })
    .catch(console.error);
}

init();

app.get('/', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Agent server started on port ${PORT} - env (${ENV})`);
});
