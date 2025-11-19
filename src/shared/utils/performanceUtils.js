/**
 * @module performanceUtils
 * @description Performance optimization utilities.
 */

/**
 * * Throttle function to prevent excessive calls
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func.apply(this, args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime),
      );
    }
  };
}

// * Unused functions removed
// function debounce(func, delay) { ... }
// function safeRequestAnimationFrame(callback) { ... }
// function batchDOMUpdates(updateFunction) { ... }
