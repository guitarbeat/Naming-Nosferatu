/**
 * @module api/apiCache
 * @description Cache management utilities for API responses
 */

/**
 * * Creates a standardized cache manager
 * @param {Object} options - Cache options
 * @returns {Object} Cache manager
 */
export function createCacheManager(options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
  } = options;

  const cache = new Map();
  const timestamps = new Map();

  const isExpired = (key) => {
    const timestamp = timestamps.get(key);
    return !timestamp || Date.now() - timestamp > ttl;
  };

  const get = (key) => {
    if (isExpired(key)) {
      cache.delete(key);
      timestamps.delete(key);
      return null;
    }
    return cache.get(key);
  };

  const set = (key, value) => {
    // Remove oldest entries if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }

    cache.set(key, value);
    timestamps.set(key, Date.now());
  };

  const clear = () => {
    cache.clear();
    timestamps.clear();
  };

  const has = (key) => {
    return cache.has(key) && !isExpired(key);
  };

  return {
    get,
    set,
    has,
    clear,
    size: () => cache.size,
  };
}
