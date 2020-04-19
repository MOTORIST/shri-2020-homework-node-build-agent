/* eslint-disable promise/param-names */
/* eslint-disable max-len */
/**
 * @param {Function} fn - Returns a promise
 * @param {Number} retriesLeft - Number of retries. If -1 will keep retrying
 * @param {Number} interval - Millis between retries. If exponential set to true will be doubled each retry
 * @param {Boolean} exponential - Flag for exponential back-off mode
 * @return {Promise<*>}
 */

const retry = (fn, retriesLeft = 5, interval = 1000, exponential = false) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    console.log(`Retry ${fn.name}`);
    console.error(error);

    if (retriesLeft) {
      await new Promise((r) => setTimeout(r, interval));

      return retry(
        fn,
        retriesLeft - 1,
        exponential ? interval * 2 : interval,
        exponential,
      )(...args);
    }

    throw new Error('Max retries reached');
  }
};

module.exports = retry;
