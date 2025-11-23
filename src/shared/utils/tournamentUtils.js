/**
 * @module tournamentUtils
 * @description Tournament-specific utility functions.
 */

import { generatePairs } from "./arrayUtils";

/**
 * * Initialize sorter pairs if not already done
 * @param {Object} sorter - The sorter object
 * @param {Array} nameList - Array of name strings
 */
export function initializeSorterPairs(sorter, nameList) {
  if (!sorter) {
    return;
  }
  if (!Array.isArray(sorter._pairs)) {
    // * Ensure nameList is an array before generating pairs
    const validNameList = Array.isArray(nameList) ? nameList : [];
    sorter._pairs = generatePairs(validNameList);
    sorter._pairIndex = 0;
  }
}

/**
 * * Get preferences map from sorter
 * @param {Object} sorter - The sorter object
 * @returns {Map} Preferences map
 */
export function getPreferencesMap(sorter) {
  return sorter.preferences instanceof Map ? sorter.preferences : new Map();
}

/**
 * * Calculate the blended rating for a name
 * @param {number} existingRating - Previous rating value
 * @param {number} position - Position in sorted list
 * @param {number} totalNames - Total number of names
 * @param {number} matchesPlayed - Matches completed
 * @param {number} maxMatches - Total matches in tournament
 * @returns {number} Final rating between 1000 and 2000
 */
export function computeRating(
  existingRating,
  position,
  totalNames,
  matchesPlayed,
  maxMatches,
) {
  const ratingSpread = Math.min(1000, totalNames * 25);
  const positionValue =
    ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
  const newPositionRating = 1500 + positionValue;
  const blendFactor = Math.min(0.8, (matchesPlayed / maxMatches) * 0.9);
  const newRating = Math.round(
    blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
  );
  return Math.max(1000, Math.min(2000, newRating));
}

/**
 * * Calculate which bracket round a match belongs to based on total names and match number
 * @param {number} namesCount - Total number of names in the tournament
 * @param {number} matchNumber - The match number (1-indexed)
 * @returns {number} The round number (1-indexed)
 */
export function calculateBracketRound(namesCount, matchNumber) {
  // * Input validation
  if (!Number.isInteger(namesCount) || namesCount < 1) {
    return 1; // * Invalid input, default to round 1
  }
  if (!Number.isInteger(matchNumber) || matchNumber < 1) {
    return 1; // * Invalid input, default to round 1
  }

  // * For bracket tournaments, maximum matches = namesCount - 1
  // * If matchNumber exceeds this, it's invalid - return the last possible round
  const maxMatches = namesCount - 1;
  if (matchNumber > maxMatches) {
    // * Calculate the maximum round number for this tournament size
    // * This is the number of rounds needed to reduce namesCount to 1
    let maxRound = 1;
    let remaining = namesCount;
    while (remaining > 1) {
      remaining = Math.ceil(remaining / 2);
      maxRound++;
    }
    return maxRound;
  }

  // * For 2 names, there's only 1 match in round 1
  if (namesCount === 2) {
    return 1;
  }

  let calculatedRound = 1;
  let remainingNames = namesCount;
  let matchesInRound = Math.floor(remainingNames / 2);
  let matchesPlayed = 0;
  const maxRounds = Math.ceil(Math.log2(namesCount)) + 1; // * Safety limit to prevent infinite loops

  // * Calculate which round based on bracket structure
  // * Round 1: Math.floor(names.length / 2) matches
  // * Each subsequent round: Math.floor(remainingNames / 2) matches
  while (
    matchesPlayed + matchesInRound < matchNumber &&
    calculatedRound < maxRounds
  ) {
    // * Guard: If no matches in this round, we've reached the final round
    if (matchesInRound === 0) {
      break;
    }
    matchesPlayed += matchesInRound;
    // * Winners advancing = matches (1 winner each) + byes (if odd number)
    const winners = matchesInRound; // 1 winner per match
    const byes = remainingNames % 2; // Odd names get a bye
    remainingNames = winners + byes; // Total advancing to next round
    matchesInRound = Math.floor(remainingNames / 2);
    calculatedRound++;
  }

  return calculatedRound;
}
