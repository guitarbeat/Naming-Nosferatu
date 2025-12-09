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
  const safeMaxMatches = Math.max(1, maxMatches);
  const blendFactor = Math.min(0.8, (matchesPlayed / safeMaxMatches) * 0.9);
  const newRating = Math.round(
    blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
  );
  return Math.max(1000, Math.min(2000, newRating));
}

// TODO: REVIEW Consider whether matchesPlayed should also be clamped to maxMatches

/**
 * * Calculate maximum number of rounds needed for a bracket tournament
 * @param {number} namesCount - Total number of names in the tournament
 * @returns {number} Maximum round number
 */
function calculateMaxRoundForNames(namesCount) {
  let maxRound = 1;
  let remainingNames = namesCount;

  while (remainingNames > 1) {
    const matchesThisRound = Math.floor(remainingNames / 2);
    const winners = matchesThisRound; // * 1 winner per match
    const byes = remainingNames % 2; // * Odd names get a bye
    remainingNames = winners + byes; // * Total advancing to next round
    maxRound++;
  }

  return maxRound;
}

/**
 * * Calculate which bracket round a match belongs to based on total names and match number
 * Uses explicit winners + byes calculation for accuracy.
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
    return calculateMaxRoundForNames(namesCount);
  }

  // * For 2 names, there's only 1 match in round 1
  if (namesCount === 2) {
    return 1;
  }

  let roundNumber = 1;
  let remainingNames = namesCount;
  let matchesPlayed = 0;
  const maxRounds = Math.ceil(Math.log2(namesCount)) + 1; // * Safety limit to prevent infinite loops

  while (matchesPlayed < matchNumber - 1 && roundNumber < maxRounds) {
    const matchesThisRound = Math.floor(remainingNames / 2);

    // * Check if this match is in the current round
    if (matchesPlayed + matchesThisRound >= matchNumber) {
      break;
    }

    // * Move to next round
    matchesPlayed += matchesThisRound;
    const winners = matchesThisRound; // * 1 winner per match
    const byes = remainingNames % 2; // * Odd names get a bye
    remainingNames = winners + byes; // * Total advancing to next round
    roundNumber++;
  }

  return roundNumber;
}
