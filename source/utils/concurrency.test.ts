import { describe, it, expect } from 'vitest';
import { asyncMapLimit } from './basic';

describe('asyncMapLimit', () => {
    it('should process items with concurrency limit', async () => {
        const items = [1, 2, 3, 4, 5];
        const limit = 2;
        let activeCount = 0;
        let maxActive = 0;

        const processItem = async (item: number) => {
            activeCount++;
            maxActive = Math.max(maxActive, activeCount);

            // Simulate async work
            await new Promise(resolve => setTimeout(resolve, 50));

            activeCount--;
            return item * 2;
        };

        const results = await asyncMapLimit(items, limit, processItem);

        expect(results).toEqual([2, 4, 6, 8, 10]);
        expect(maxActive).toBeLessThanOrEqual(limit);
    });

    it('should handle empty array', async () => {
        const results = await asyncMapLimit([], 2, async (x) => x);
        expect(results).toEqual([]);
    });

    it('should handle limit greater than array length', async () => {
        const items = [1, 2];
        const results = await asyncMapLimit(items, 5, async (x) => x * 2);
        expect(results).toEqual([2, 4]);
    });

    it('should propagate errors', async () => {
        const items = [1, 2, 3];
        const processItem = async (item: number) => {
            if (item === 2) throw new Error('Failed');
            return item;
        };

        await expect(asyncMapLimit(items, 2, processItem)).rejects.toThrow('Failed');
    });
});
