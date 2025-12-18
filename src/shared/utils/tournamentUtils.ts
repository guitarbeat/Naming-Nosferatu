/**
 * @module tournamentUtils
 * @description Tournament-specific utility functions.
 */

import { generatePairs } from "./arrayUtils";
import { NameItem } from "../propTypes";

interface Sorter {
  _pairs?: Array<[unknown, unknown]>;
  _pairIndex?: number;
  preferences?: Map<string, unknown>;
}

/**
 * * Initialize sorter pairs if not already done
 * @param sorter - The sorter object
 * @param nameList - Array of name items (NameItem from propTypes)
 */
export function initializeSorterPairs(sorter: Sorter | null, nameList: NameItem[]): void {
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
 * @param sorter - The sorter object
 * @returns Preferences map
 */
export function getPreferencesMap(sorter: Sorter): Map<string, unknown> {
  return sorter.preferences instanceof Map ? sorter.preferences : new Map();
}

/**
 * * Calculate the blended rating for a name
 * @param existingRating - Previous rating value
 * @param position - Position in sorted list
 * @param totalNames - Total number of names
 * @param matchesPlayed - Matches completed
 * @param maxMatches - Total matches in tournament
 * @returns Final rating between 1000 and 2000
 */
export function computeRating(
  existingRating: number,
  position: number,
  totalNames: number,
  matchesPlayed: number,
  maxMatches: number
): number {
  const ratingSpread = Math.min(1000, totalNames * 25);
  const positionValue =
    ((totalNames - position - 1) / (totalNames - 1)) * ratingSpread;
  const newPositionRating = 1500 + positionValue;

  // * Ensure maxMatches is at least 1 to avoid division by zero
  const safeMaxMatches = Math.max(1, maxMatches);
  // * Clamp matchesPlayed to be between 0 and safeMaxMatches to prevent logical inconsistencies

  // * Clamp matchesPlayed to be between 0 and safeMaxMatches
  // * This prevents logical inconsistencies if matchesPlayed > maxMatches
  const safeMatchesPlayed = Math.max(
    0,
    Math.min(matchesPlayed, safeMaxMatches),
  );

  const blendFactor = Math.min(0.8, (safeMatchesPlayed / safeMaxMatches) * 0.9);

  const newRating = Math.round(
    blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
  );
  return Math.max(1000, Math.min(2000, newRating));
}

/**
 * * Calculate maximum number of rounds needed for a bracket tournament
 * @param namesCount - Total number of names in the tournament
 * @returns Maximum round number
 */
function calculateMaxRoundForNames(namesCount: number): number {
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
 * @param namesCount - Total number of names in the tournament
 * @param matchNumber - The match number (1-indexed)
 * @returns The round number (1-indexed)
 */
export function calculateBracketRound(namesCount: number, matchNumber: number): number {
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


/**
 * Generate bump chart data from tournament match history
 * Shows how rankings change across tournament rounds based on match results
 * @param {Array} matchHistory - Array of match records with winners/losers
 * @param {Array} names - Array of tournament name objects
 * @param {Object} initialRatings - Initial ratings for each name
 * @param {number} maxDisplayed - Maximum number of series to display (default: 10)
 * @returns {Object} Bump chart data with series and labels
 */
export function generateTournamentBumpChartData(
  matchHistory: Array<{
    roundNumber?: number;
    winner?: string | null;
    loser?: string | null;
    voteType?: string;
    match?: {
      left?: { name?: string } | string;
      right?: { name?: string } | string;
    };
  }>,
  names: Array<{ name?: string } | string>,
  initialRatings: Record<string, { rating?: number; wins?: number; losses?: number }> = {},
  maxDisplayed = 10,
): { data: Array<{ id: string; name: string; rankings: number[] }>; labels: string[] } {
  if (!matchHistory || !names || matchHistory.length === 0 || names.length === 0) {
    return { data: [], labels: [] };
  }

  // Initialize ratings for all names
  const ratings: Record<string, { rating: number; wins: number; losses: number }> = {};
  names.forEach((name) => {
    const nameStr = typeof name === 'string' ? name : (name.name || '');
    if (nameStr) {
      ratings[nameStr] = {
        rating: initialRatings[nameStr]?.rating || 1500,
        wins: initialRatings[nameStr]?.wins || 0,
        losses: initialRatings[nameStr]?.losses || 0,
      };
    }
  });

  // Group matches by round
  const matchesByRound: Record<number, typeof matchHistory> = {};
  let maxRound = 0;

  matchHistory.forEach((match) => {
    const round = match.roundNumber || 1;
    maxRound = Math.max(maxRound, round);

    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  // Calculate rankings after each round
  const rankingsByRound: Array<{ round: number; rankings: Record<string, number> }> = [];

  // Initial rankings (Round 0 - before tournament starts)
  const initialRankings: Record<string, number> = {};
  Object.entries(ratings)
    .sort(([, a], [, b]) => b.rating - a.rating)
    .forEach(([name], index) => {
      initialRankings[name] = index + 1;
    });

  rankingsByRound.push({ round: 0, rankings: { ...initialRankings } });

  // Process each round
  for (let round = 1; round <= maxRound; round++) {
    const roundMatches = matchesByRound[round] || [];

    // Update ratings based on matches in this round
    roundMatches.forEach((match) => {
      const { winner, loser } = match;

      if (winner && ratings[winner]) {
        ratings[winner].rating += 20; // Simple rating increase for winner
        ratings[winner].wins += 1;
      }

      if (loser && ratings[loser]) {
        ratings[loser].rating -= 10; // Smaller rating decrease for loser
        ratings[loser].losses += 1;
      }

      // Handle ties (both win or neutral)
      if (match.voteType === 'both' || match.voteType === 'neutral') {
        const leftMatch = match.match?.left;
        const rightMatch = match.match?.right;
        const left = typeof leftMatch === 'string' ? leftMatch : leftMatch?.name;
        const right = typeof rightMatch === 'string' ? rightMatch : rightMatch?.name;

        if (left && ratings[left]) {
          ratings[left].rating += 5;
        }
        if (right && ratings[right]) {
          ratings[right].rating += 5;
        }
      }
    });

    // Calculate rankings after this round
    const roundRankings: Record<string, number> = {};
    Object.entries(ratings)
      .sort(([, a], [, b]) => b.rating - a.rating)
      .forEach(([name], index) => {
        roundRankings[name] = index + 1;
      });

    rankingsByRound.push({ round, rankings: { ...roundRankings } });
  }

  // Convert to bump chart format
  const allNames = Object.keys(ratings);

  // Sort names by final ranking to show top performers
  const finalRankings = rankingsByRound[rankingsByRound.length - 1].rankings;
  const sortedNames = allNames.sort((a, b) => finalRankings[a] - finalRankings[b]);

  // Limit to top N names
  const displayNames = sortedNames.slice(0, maxDisplayed);

  const data = displayNames.map((name) => ({
    id: name,
    name,
    rankings: rankingsByRound.map((r) => r.rankings[name] || allNames.length),
  }));

  const labels = rankingsByRound.map((r) =>
    r.round === 0 ? 'Start' : `Round ${r.round}`
  );

  return { data, labels };
}
