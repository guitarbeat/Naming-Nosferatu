/**
 * @module functionUtils
 * @description Utility functions for function manipulation (debounce, throttle, etc.)
 */

/**
 * Creates a debounced function that delays invoking func until after wait ms
 * have elapsed since the last time the debounced function was invoked.
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge (default: false)
 * @param {boolean} options.trailing - Invoke on the trailing edge (default: true)
 * @returns {Function} The debounced function with a cancel method
 */
export function debounce(func, wait, options = {}) {
  const { leading = false, trailing = true } = options;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result = null;

  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    result = func.apply(thisArg, args);
    return result;
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const shouldCallNow = leading && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && lastArgs) {
        invokeFunc();
      }
    }, wait);

    if (shouldCallNow) {
      return invokeFunc();
    }

    return result;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      timeoutId = null;
      return invokeFunc();
    }
    return result;
  };

  return debounced;
}

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

/**
 * Creates a function that is only called once
 * @param {Function} func - The function to restrict
 * @returns {Function} The restricted function
 */
export function once(func) {
  let called = false;
  let result = null;

  return function (...args) {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }
    return result;
  };
}

/**
 * Creates a memoized version of a function
 * @param {Function} func - The function to memoize
 * @param {Function} resolver - Optional function to resolve the cache key
 * @returns {Function} The memoized function with a cache property
 */
export function memoize(func, resolver) {
  const cache = new Map();

  function memoized(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

export default {
  debounce,
  throttle,
  once,
  memoize,
};
