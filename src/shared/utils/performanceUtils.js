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
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * * Debounce function to delay execution until after calls have stopped
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * * Request animation frame wrapper to prevent forced reflows
 * @param {Function} callback - Function to execute on next frame
 * @returns {number} Animation frame ID
 */
export function safeRequestAnimationFrame(callback) {
  return requestAnimationFrame(() => {
    // * Use another RAF to ensure we're not in a forced reflow
    requestAnimationFrame(callback);
  });
}

/**
 * * Batch DOM updates to prevent layout thrashing
 * @param {Function} updateFunction - Function containing DOM updates
 */
export function batchDOMUpdates(updateFunction) {
  // * Use RAF to batch updates
  requestAnimationFrame(() => {
    // * Temporarily disable layout calculations
    const originalStyle = document.body.style.display;
    document.body.style.display = 'none';

    // * Perform updates
    updateFunction();

    // * Re-enable layout calculations
    document.body.style.display = originalStyle;
  });
}

