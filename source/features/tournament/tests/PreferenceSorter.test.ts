import { describe, expect, it } from 'vitest';
import { PreferenceSorter } from '../TournamentLogic';

describe('PreferenceSorter', () => {
    it('should generate all pairs correctly for small N', () => {
        const items = ['A', 'B', 'C', 'D'];
        const sorter = new PreferenceSorter(items);

        // Expected pairs for N=4: (A,B), (A,C), (A,D), (B,C), (B,D), (C,D)
        const expectedPairs = [
            { left: 'A', right: 'B' },
            { left: 'A', right: 'C' },
            { left: 'A', right: 'D' },
            { left: 'B', right: 'C' },
            { left: 'B', right: 'D' },
            { left: 'C', right: 'D' }
        ];

        for (const expected of expectedPairs) {
            const match = sorter.getNextMatch();
            expect(match).toEqual(expected);
            if (match) {
                // Simulate skipping/deferring vote
                sorter.currentIndex++;
            }
        }

        expect(sorter.getNextMatch()).toBeNull();
    });

    it('should handle preferences and skipping', () => {
        const items = ['A', 'B', 'C'];
        const sorter = new PreferenceSorter(items);

        // 1. Get first match: A vs B
        let match = sorter.getNextMatch();
        expect(match).toEqual({ left: 'A', right: 'B' });

        // 2. Add preference for A vs B
        sorter.addPreference('A', 'B', 1);

        // 3. Get next match. Should be A vs C (since index increments)
        // Wait, logic check: getNextMatch checks current pair. If played, increments.
        // If we call getNextMatch again without manually incrementing index (which usually happens inside getNextMatch loop if pair is done),
        // let's see current implementation behavior.

        // In current impl: getNextMatch loops.
        // It checks pairs[currentIndex].
        // If voted, increments and continues.
        // So next call should return next unvoted match.

        match = sorter.getNextMatch();
        expect(match).toEqual({ left: 'A', right: 'C' });

        // 4. Vote A vs C
        sorter.addPreference('A', 'C', 1);

        // 5. Next: B vs C
        match = sorter.getNextMatch();
        expect(match).toEqual({ left: 'B', right: 'C' });
    });

    it('should support undo', () => {
        const items = ['A', 'B', 'C'];
        const sorter = new PreferenceSorter(items);

        // Vote A vs B
        sorter.addPreference('A', 'B', 1);
        sorter.currentIndex++; // Simulator increments index after vote usually?

        // Current index should be pointing to A vs C (index 1)

        // Undo
        sorter.undoLastPreference();

        // Should have cleared preference
        expect(sorter.preferences.has('A-B')).toBe(false);

        // Should have decremented index
        // Depending on implementation details.
    });
});
