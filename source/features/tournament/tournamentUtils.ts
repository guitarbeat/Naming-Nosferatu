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
}
