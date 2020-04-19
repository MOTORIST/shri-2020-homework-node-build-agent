const axios = require('axios');
const { SERVER_HOST, SERVER_PORT } = require('../config');

const httpApi = axios.create({
  baseURL: `${SERVER_HOST}:${SERVER_PORT}`,
  timeout: 3000,
});

async function notifyAgent(host, port) {
  return httpApi.post('/notify-agent', { host, port });
}

async function notifyBuildResult(agentId, buildId, duration, buildLog, status) {
  return httpApi.post('/notify-build-result', { agentId, buildId, duration, buildLog, status });
}

module.exports = {
  notifyBuildResult,
  notifyAgent,
};
