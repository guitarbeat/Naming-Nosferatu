/**
 * @module arrayUtils
 * @description Array manipulation utilities.
 */

/**
 * * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * * Generate all possible pairs from a list of names
 * @param {Array} nameList - Array of name strings
 * @returns {Array} Array of [name1, name2] pairs
 */
interface NameItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

export function generatePairs(nameList: NameItem[]): [NameItem, NameItem][] {
  const pairs: [NameItem, NameItem][] = [];
  for (let i = 0; i < nameList.length; i++) {
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
interface ComparisonHistory {
  winner: string;
  loser: string;
}

export function buildComparisonsMap(history: ComparisonHistory[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  history.forEach(({ winner, loser }) => {
    const key = `${winner}-${loser}`;
    map.set(key, true);
  });
  return map;
}
