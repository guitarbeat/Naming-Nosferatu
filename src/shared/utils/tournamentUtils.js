/**
 * Computes a new rating by blending an existing rating with a new position rating based on the number of matches played.
 *
 * @param {number} existingRating The player's current rating.
 * @param {number} newPositionRating The rating derived from the player's new position/performance.
 * @param {number} matchesPlayed The number of matches the player has played.
 * @param {number} maxMatches The maximum number of matches possible or considered for full confidence.
 * @returns {number} The new computed rating, clamped between 1000 and 2000.
 */
export function computeRating(existingRating, newPositionRating, matchesPlayed, maxMatches) {
	const safeMaxMatches = Math.max(1, maxMatches);
	// Clamp matchesPlayed to maxMatches to prevent logical inconsistencies
	const clampedMatchesPlayed = Math.min(matchesPlayed, safeMaxMatches);
	const blendFactor = Math.min(0.8, (clampedMatchesPlayed / safeMaxMatches) * 0.9);
	const newRating = Math.round(
		blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
	);
	return Math.max(1000, Math.min(2000, newRating));
}
