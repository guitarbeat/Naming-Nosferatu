/**
 * @module arrayUtils
 * @description Array manipulation utilities.
 */

/**
 * * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) {
    console.warn("shuffleArray received non-array input:", array);
    return [];
  }

  const newArray = [...array];
  try {
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in shuffleArray:", error);
    }
    return array;
  }
}

/**
 * * Generate all possible pairs from a list of names
 * @param {Array} nameList - Array of name strings
 * @returns {Array} Array of [name1, name2] pairs
 */
export function generatePairs(nameList) {
  const pairs = [];
  for (let i = 0; i < nameList.length - 1; i++) {
    for (let j = i + 1; j < nameList.length; j++) {
      pairs.push([nameList[i], nameList[j]]);
    }
  }
  return pairs;
}

/**
 * * Build a comparisons map from tournament history
 * @param {Array} history - Array of tournament history entries
 * @returns {Map} Map of name -> comparison count
 */
export function buildComparisonsMap(history) {
  const comparisons = new Map();
  for (const v of history) {
    const l = v?.match?.left?.name;
    const r = v?.match?.right?.name;
    if (l) comparisons.set(l, (comparisons.get(l) || 0) + 1);
    if (r) comparisons.set(r, (comparisons.get(r) || 0) + 1);
  }
  return comparisons;
}

/**
 * Check if value is a non-empty array
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a non-empty array
 */
export function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if value is an empty array or not an array
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty or not an array
 */
export function isEmptyOrNotArray(value) {
  return !Array.isArray(value) || value.length === 0;
}

/**
 * Safely get array length, returns 0 for non-arrays
 * @param {*} value - Value to check
 * @returns {number} Array length or 0
 */
export function safeArrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Remove duplicates from array by key
 * @param {Array} array - Array to deduplicate
 * @param {string|Function} key - Key to deduplicate by (string or getter function)
 * @returns {Array} Deduplicated array
 */
export function uniqueBy(array, key) {
  if (!Array.isArray(array)) return [];

  const seen = new Set();
  const getKey = typeof key === "function" ? key : (item) => item[key];

  return array.filter((item) => {
    const k = getKey(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Group array items by key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by (string or getter function)
 * @returns {Object} Object with keys as group names and values as arrays
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) return {};

  const getKey = typeof key === "function" ? key : (item) => item[key];

  return array.reduce((groups, item) => {
    const k = getKey(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
    return groups;
  }, {});
}

/**
 * Sort array by a numeric field in descending order
 * @param {Array} array - Array to sort
 * @param {string|Function} key - Key to sort by (string or getter function)
 * @param {string} order - Sort order: 'desc' (default) or 'asc'
 * @returns {Array} New sorted array
 */
export function sortByNumber(array, key, order = "desc") {
  if (!Array.isArray(array)) return [];

  const getKey = typeof key === "function" ? key : (item) => item[key] ?? 0;
  const multiplier = order === "asc" ? 1 : -1;

  return [...array].sort((a, b) => multiplier * (getKey(b) - getKey(a)));
}

/**
 * Sort array by a string field alphabetically
 * @param {Array} array - Array to sort
 * @param {string|Function} key - Key to sort by (string or getter function)
 * @param {string} order - Sort order: 'asc' (default) or 'desc'
 * @returns {Array} New sorted array
 */
export function sortByString(array, key, order = "asc") {
  if (!Array.isArray(array)) return [];

  const getKey = typeof key === "function" ? key : (item) => item[key] ?? "";
  const multiplier = order === "asc" ? 1 : -1;

  return [...array].sort(
    (a, b) => multiplier * getKey(a).localeCompare(getKey(b)),
  );
}

/**
 * Sort array by a date field
 * @param {Array} array - Array to sort
 * @param {string|Function} key - Key to sort by (string or getter function)
 * @param {string} order - Sort order: 'desc' (default, newest first) or 'asc'
 * @returns {Array} New sorted array
 */
export function sortByDate(array, key, order = "desc") {
  if (!Array.isArray(array)) return [];

  const getKey = typeof key === "function" ? key : (item) => item[key];
  const multiplier = order === "asc" ? 1 : -1;

  return [...array].sort((a, b) => {
    const dateA = new Date(getKey(a));
    const dateB = new Date(getKey(b));
    return multiplier * (dateB - dateA);
  });
}

/**
 * Get top N items from array sorted by a field
 * @param {Array} array - Array to process
 * @param {string|Function} key - Key to sort by
 * @param {number} limit - Number of items to return
 * @param {string} order - Sort order: 'desc' (default) or 'asc'
 * @returns {Array} Top N items
 */
export function topN(array, key, limit = 5, order = "desc") {
  return sortByNumber(array, key, order).slice(0, limit);
}
