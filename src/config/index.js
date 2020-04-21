const path = require('path');

module.exports = {
  ENV: process.env.ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  SERVER_HOST: process.env.SERVER_HOST,
  SERVER_PORT: process.env.SERVER_PORT,
  APP_DIR: path.resolve(),
};
