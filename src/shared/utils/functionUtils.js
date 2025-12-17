/**
 * @module functionUtils
 * @description Utility functions for function manipulation (debounce, throttle, etc.)
 */

/**
 * Creates a throttled function that only invokes func at most once per every wait ms.
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge (default: true)
 * @param {boolean} options.trailing - Invoke on the trailing edge (default: true)
 * @returns {Function} The throttled function with a cancel method
 */
export function throttle(func, wait, options = {}) {
  const { leading = true, trailing = true } = options;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;

  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    return func.apply(thisArg, args);
  }

  function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    const shouldCallNow = leading && timeSinceLastCall >= wait;

    lastArgs = args;
    lastThis = this;

    if (shouldCallNow) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return invokeFunc();
    }

    if (!timeoutId && trailing) {
      const remaining = wait - timeSinceLastCall;
      timeoutId = setTimeout(
        () => {
          timeoutId = null;
          if (trailing && lastArgs) {
            invokeFunc();
          }
        },
        remaining > 0 ? remaining : wait,
      );
    }
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  return throttled;
}

// Unused utility functions removed:
// - once
// - memoize

