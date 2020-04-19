const util = require('util');
const path = require('path');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

/**
 * Clone repository
 * @param {string} repoName
 */
async function clone(repoName, dir) {
  try {
    const repo = `https://github.com/${repoName}.git`;
    const command = `git clone ${repo} ${dir}`;

    if (!fs.existsSync(dir)) {
      return;
    }

    return exec(command);
  } catch (error) {
    const message = `Failed to clone repository "${repoName}"`;
    console.error(message);
    throw error;
  }
}

async function pull(repoName, dir) {
  try {
    const repoDir = path.join(dir, repoName);
    const command = 'git pull';

    if (!fs.existsSync(repoDir)) {
      return;
    }

    return exec(command, { cwd: repoDir });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function checkout(commitHash, dir) {
  try {
    const command = `git checkout ${commitHash}`;

    if (!fs.existsSync(dir)) {
      return;
    }

    return exec(command, { cwd: dir });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function runCommandInRepo(command, repoName, dir) {
  try {
    const repoDir = path.join(dir, repoName);

    if (!fs.existsSync(repoDir)) {
      return null;
    }

    return exec(command, { cwd: repoDir });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  clone,
  pull,
  checkout,
  runCommandInRepo,
};
