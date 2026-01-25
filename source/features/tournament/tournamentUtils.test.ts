import { describe, it, expect } from 'vitest';
import { computeRating } from './tournamentUtils';

describe('computeRating', () => {
  it('should clamp rating between 1000 and 2000', () => {
    // Below 1000
    expect(computeRating(10, 10, 500, 500)).toBe(1000);
    // Above 2000
    expect(computeRating(10, 10, 2500, 2500)).toBe(2000);
  });

  it('should blend ratings correctly', () => {
    // maxMatches = 10, matchesPlayed = 5 -> 50% progress
    // blendFactor = min(0.8, (5/10) * 0.9) = min(0.8, 0.45) = 0.45
    // newRating = 0.45 * 1600 + 0.55 * 1400 = 720 + 770 = 1490
    const result = computeRating(5, 10, 1600, 1400);
    expect(result).toBe(1490);
  });

  it('should handle matchesPlayed exceeding maxMatches by treating it as maxMatches (saturation)', () => {
    // Even if matchesPlayed is huge, it shouldn't break or produce weird values.
    // With clamping, effective matchesPlayed is 10.
    // Ratio = 1.0. Factor = 0.9. Blend = min(0.8, 0.9) = 0.8.
    // Result: 0.8 * 1600 + 0.2 * 1400 = 1280 + 280 = 1560.
    const result = computeRating(100, 10, 1600, 1400);
    expect(result).toBe(1560);
  });

  it('should handle zero maxMatches safely', () => {
      // maxMatches = 0 -> safeMaxMatches = 1
      // matchesPlayed = 1. Clamped = 1.
      // Ratio = 1. Factor = 0.9. Blend = 0.8.
      // Result: 0.8 * 1600 + 0.2 * 1400 = 1560.
      expect(computeRating(1, 0, 1600, 1400)).toBe(1560);
  });
});
