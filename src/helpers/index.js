const rimraf = require('rimraf');
const { exec } = require('child_process');
const fs = require('fs');

function removeDir(dir) {
  return new Promise((resolve, reject) => {
    rimraf(dir, (error) => {
      if (error) {
        reject(error);
      }

      resolve(true);
    });
  });
}

function createDir(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, (error) => {
      if (error) {
        reject(error);
      }

      resolve(true);
    });
  });
}

function execCommand(command, dir) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }

      resolve(stdout + stderr);
    });
  });
}

module.exports = {
  removeDir,
  createDir,
  execCommand,
};
