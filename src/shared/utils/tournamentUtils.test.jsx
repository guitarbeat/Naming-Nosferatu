import { computeRating } from './tournamentUtils';

describe('computeRating', () => {
  it('should compute rating correctly for standard inputs', () => {
    // existingRating=1500, position=0 (top), totalNames=10, matchesPlayed=5, maxMatches=10
    // Expected calculation:
    // ratingSpread = 250
    // positionValue = 250
    // newPositionRating = 1750
    // blendFactor = min(0.8, (5/10) * 0.9) = 0.45
    // newRating = round(0.45 * 1750 + 0.55 * 1500) = round(787.5 + 825) = 1613
    expect(computeRating(1500, 0, 10, 5, 10)).toBe(1613);
  });

  it('should handle matchesPlayed exceeding maxMatches by clamping (implicitly capped by blendFactor logic)', () => {
    // Even though the blendFactor cap (0.8) handles large values, clamping ensures correctness conceptually.
    // matchesPlayed=20, maxMatches=10
    // If clamped to 10: blendFactor = min(0.8, (10/10)*0.9) = min(0.8, 0.9) = 0.8
    // Result: 0.8 * 1750 + 0.2 * 1500 = 1400 + 300 = 1700
    expect(computeRating(1500, 0, 10, 20, 10)).toBe(1700);
  });

  it('should clamp negative matchesPlayed to 0', () => {
    // matchesPlayed=-5, maxMatches=10
    // Clamped to 0: blendFactor = min(0.8, (0/10)*0.9) = 0
    // Result: 0 * 1750 + 1 * 1500 = 1500
    expect(computeRating(1500, 0, 10, -5, 10)).toBe(1500);
  });
});
