import { describe, it, expect, beforeEach } from 'vitest';
import { PreferenceSorter, EloRating, calculateBracketRound } from './tournament';
import { ELO_RATING } from '@/shared/lib/constants';

describe('PreferenceSorter', () => {
    let sorter: PreferenceSorter;
    const items = ['A', 'B', 'C', 'D'];

    beforeEach(() => {
        sorter = new PreferenceSorter(items);
    });

    it('initializes correctly with given items', () => {
        expect(sorter.items).toEqual(items);
        expect(sorter.currentIndex).toBe(0);
        expect(sorter.preferences.size).toBe(0);
    });

    it('returns null for getNextMatch when less than 2 items are provided', () => {
        const invalidSorter = new PreferenceSorter(['A']);
        expect(invalidSorter.getNextMatch()).toBeNull();
    });

    it('yields all possible pairs systematically', () => {
        const pairs: {left: string, right: string}[] = [];
        let match = sorter.getNextMatch();
        while (match) {
            pairs.push(match);
            sorter.addPreference(match.left, match.right, 1);
            match = sorter.getNextMatch();
        }

        // For N=4, total pairs = 4 * 3 / 2 = 6
        expect(pairs.length).toBe(6);
        expect(pairs).toEqual([
            { left: 'A', right: 'B' },
            { left: 'A', right: 'C' },
            { left: 'A', right: 'D' },
            { left: 'B', right: 'C' },
            { left: 'B', right: 'D' },
            { left: 'C', right: 'D' }
        ]);
        expect(sorter.getNextMatch()).toBeNull();
    });

    it('skips pairs that already exist in preferences', () => {
        // Start at index 0 (A-B)
        // If we set the preference directly in the map without changing currentIndex:
        sorter.preferences.set('A-B', 1);
        sorter.preferences.set('D-A', 1); // equivalent to A-D

        // getNextMatch starts looking from currentIndex (0)
        // A-B is in map -> skips
        // next is A-C -> not in map -> returns A-C
        const match1 = sorter.getNextMatch();
        expect(match1).toEqual({ left: 'A', right: 'C' });

        if (match1) {
            // we simulate adding preference which usually increments index
            sorter.preferences.set('A-C', 1);
        }

        // At this point, getNextMatch was called and it returned A-C, but did NOT mutate currentIndex.
        // It's still 0. Next call it scans A-B, A-C, A-D...
        const match2 = sorter.getNextMatch();
        expect(match2).toEqual({ left: 'B', right: 'C' }); // because A-D is in map (D-A)
    });

    it('undoLastPreference correctly restores state', () => {
        const match1 = sorter.getNextMatch(); // A, B
        if(match1) sorter.addPreference(match1.left, match1.right, 1);

        const match2 = sorter.getNextMatch(); // A, C
        if(match2) sorter.addPreference(match2.left, match2.right, 1);

        expect(sorter.preferences.has('A-C')).toBe(true);
        expect(sorter.currentIndex).toBe(2);

        sorter.undoLastPreference();

        expect(sorter.preferences.has('A-C')).toBe(false);
        expect(sorter.currentIndex).toBe(1);

        // Next match should be A-C again
        const match3 = sorter.getNextMatch();
        expect(match3).toEqual({ left: 'A', right: 'C' });
    });

    it('undoLastPreference does nothing when history is empty', () => {
        sorter.undoLastPreference();
        expect(sorter.currentIndex).toBe(0);
        expect(sorter.preferences.size).toBe(0);
    });
});

describe('calculateBracketRound', () => {
    it('returns 1 when totalNames is 2 or fewer', () => {
        expect(calculateBracketRound(2, 5)).toBe(1);
        expect(calculateBracketRound(1, 1)).toBe(1);
    });

    it('calculates rounds correctly for larger inputs', () => {
        // totalNames = 8, matchesPerRound = 4
        expect(calculateBracketRound(8, 1)).toBe(1);
        expect(calculateBracketRound(8, 4)).toBe(1);
        expect(calculateBracketRound(8, 5)).toBe(2);
        expect(calculateBracketRound(8, 8)).toBe(2);
    });
});

describe('EloRating', () => {
    let elo: EloRating;

    beforeEach(() => {
        elo = new EloRating();
    });

    it('initializes with default values', () => {
        expect(elo.defaultRating).toBe(ELO_RATING.DEFAULT_RATING);
        expect(elo.kFactor).toBe(ELO_RATING.DEFAULT_K_FACTOR);
    });

    it('calculates expected score correctly', () => {
        // Same rating -> expected 0.5
        expect(elo.getExpectedScore(1200, 1200)).toBe(0.5);
        // Ra > Rb -> expected > 0.5
        expect(elo.getExpectedScore(1600, 1200)).toBeGreaterThan(0.5);
    });

    it('updates rating correctly and stays within bounds', () => {
        // R=1200, Exp=0.5, Act=1, K=40 (games > threshold to use default kFactor 40)
        // newR = 1200 + 40 * (1 - 0.5) = 1220
        expect(elo.updateRating(1200, 0.5, 1, ELO_RATING.NEW_PLAYER_GAME_THRESHOLD + 1)).toBe(1220);

        // Check new player kFactor multiplier (K=80)
        // newR = 1200 + (40*2) * (1 - 0.5) = 1240
        expect(elo.updateRating(1200, 0.5, 1, 0)).toBe(1240);

        // Bounds testing (assuming MIN_RATING=800, MAX_RATING=2400)
        expect(elo.updateRating(ELO_RATING.MIN_RATING, 0.9, 0, 100)).toBe(ELO_RATING.MIN_RATING); // Would drop below, clamped to min
        expect(elo.updateRating(ELO_RATING.MAX_RATING, 0.1, 1, 100)).toBe(ELO_RATING.MAX_RATING); // Would exceed, clamped to max
    });

    it('calculates new ratings based on outcomes', () => {
        // Win for left
        const resWinLeft = elo.calculateNewRatings(1200, 1200, 'left');
        expect(resWinLeft.newRatingA).toBeGreaterThan(1200);
        expect(resWinLeft.newRatingB).toBeLessThan(1200);
        expect(resWinLeft.winsA).toBe(1);
        expect(resWinLeft.lossesB).toBe(1);

        // Win for right
        const resWinRight = elo.calculateNewRatings(1200, 1200, 'right');
        expect(resWinRight.newRatingB).toBeGreaterThan(1200);
        expect(resWinRight.newRatingA).toBeLessThan(1200);

        // Skip
        const resSkip = elo.calculateNewRatings(1200, 1200, 'skip');
        expect(resSkip.newRatingA).toBe(1200);
        expect(resSkip.newRatingB).toBe(1200);
    });
});
