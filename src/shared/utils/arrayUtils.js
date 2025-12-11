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

// Unused utility functions removed:
// - isNonEmptyArray
// - isEmptyOrNotArray
// - uniqueBy
// - groupBy
// - sortByNumber
// - sortByString
// - sortByDate
// - topN
