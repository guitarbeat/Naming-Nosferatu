
import { describe, it, expect } from 'vitest';
import { EloRating, getRandomCatImage, deduplicateImages } from './tournamentUtils';
import { ELO_RATING } from '../../core/constants';

describe('EloRating', () => {
    const elo = new EloRating();

    describe('getExpectedScore', () => {
        it('should return 0.5 for equal ratings', () => {
            expect(elo.getExpectedScore(1500, 1500)).toBeCloseTo(0.5);
        });

        it('should return > 0.5 when player A has higher rating', () => {
            expect(elo.getExpectedScore(1600, 1500)).toBeGreaterThan(0.5);
        });

        it('should return < 0.5 when player A has lower rating', () => {
            expect(elo.getExpectedScore(1400, 1500)).toBeLessThan(0.5);
        });
    });

    describe('calculateNewRatings', () => {
        it('should increase winner rating and decrease loser rating (Left Win)', () => {
            const result = elo.calculateNewRatings(1500, 1500, 'left');
            expect(result.newRatingA).toBeGreaterThan(1500);
            expect(result.newRatingB).toBeLessThan(1500);
            expect(result.winsA).toBe(1);
            expect(result.lossesB).toBe(1);
        });

        it('should increase winner rating and decrease loser rating (Right Win)', () => {
            const result = elo.calculateNewRatings(1500, 1500, 'right');
            expect(result.newRatingA).toBeLessThan(1500);
            expect(result.newRatingB).toBeGreaterThan(1500);
            expect(result.winsB).toBe(1);
            expect(result.lossesA).toBe(1);
        });

        it('should handle "both" vote correctly (both increase)', () => {
            const result = elo.calculateNewRatings(1500, 1500, 'both');
            expect(result.newRatingA).toBeGreaterThan(1500);
            expect(result.newRatingB).toBeGreaterThan(1500);
            expect(result.winsA).toBe(1);
            expect(result.winsB).toBe(1);
        });
    });
});

describe('Utils', () => {
    describe('getRandomCatImage', () => {
        const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

        it('should return deterministic image for same ID', () => {
            const result1 = getRandomCatImage('cat-1', images);
            const result2 = getRandomCatImage('cat-1', images);
            expect(result1).toBe(result2);
        });

        it('should return undefined for empty list', () => {
            expect(getRandomCatImage('cat-1', [])).toBeUndefined();
        });
    });

    describe('deduplicateImages', () => {
        it('should remove duplicates ignoring extension', () => {
            const input = ['cat.jpg', 'cat.png', 'dog.jpg'];
            const result = deduplicateImages(input);
            expect(result).toHaveLength(2);
            expect(result).toEqual(['cat.jpg', 'dog.jpg']);
        });
    });

    describe('PreferenceSorter', () => {
        const { PreferenceSorter } = jest.requireActual('./tournamentUtils');
        // We can't import class directly if it wasn't exported in original create,
        // but based on previous file view, it IS exported.
        // Let's use the imported one from top of file if possible, or re-import.
    });

});
