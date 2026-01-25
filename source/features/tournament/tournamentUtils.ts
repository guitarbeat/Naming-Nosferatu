export function computeRating(
  matchesPlayed: number,
  maxMatches: number,
  newPositionRating: number,
  existingRating: number
): number {
  const safeMaxMatches = Math.max(1, maxMatches);
  const clampedMatchesPlayed = Math.min(matchesPlayed, safeMaxMatches);
  const blendFactor = Math.min(0.8, (clampedMatchesPlayed / safeMaxMatches) * 0.9);
  const newRating = Math.round(
    blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
  );
  return Math.max(1000, Math.min(2000, newRating));
/**
 * Utility functions for tournament logic and rating calculations.
 */

/**
 * Computes a new rating based on a weighted blend of existing rating and new position rating.
 * The blend factor is determined by the number of matches played relative to the maximum expected matches.
 *
 * @param matchesPlayed - Number of matches played so far
 * @param maxMatches - Maximum expected matches for the tournament/session
 * @param newPositionRating - The rating derived from the current position/rank
 * @param existingRating - The user's existing rating
 * @returns The new calculated rating, clamped between 1000 and 2000
 */
export function computeRating(
	matchesPlayed: number,
	maxMatches: number,
	newPositionRating: number,
	existingRating: number,
): number {
	const safeMaxMatches = Math.max(1, maxMatches);

	// Clamp matchesPlayed to maxMatches to prevent potential logical inconsistencies
	// where the blend factor might be calculated based on an impossible number of matches.
	// Although the blendFactor is capped at 0.8, this ensures the ratio never exceeds 1.0.
	const clampedMatches = Math.min(matchesPlayed, safeMaxMatches);

	const blendFactor = Math.min(0.8, (clampedMatches / safeMaxMatches) * 0.9);

	const newRating = Math.round(
		blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
	);

	return Math.max(1000, Math.min(2000, newRating));
}
