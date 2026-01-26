
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsAPI } from './analyticsService';

// Mock data
const mockSelections = Array.from({ length: 100 }, (_, i) => ({
    name_id: i % 10,
    name: `Name ${i % 10}`,
    user_name: `User ${i % 5}`
}));

const mockRatings = Array.from({ length: 50 }, (_, i) => ({
    name_id: i % 10,
    rating: 1500 + i,
    wins: i,
    losses: 0,
    user_name: `User ${i % 5}`
}));

const mockNames = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `Name ${i}`,
    description: `Desc ${i}`,
    avg_rating: 1500,
    categories: ['cat1'],
    created_at: '2023-01-01',
    is_active: true,
    is_hidden: false
}));

// Define mock client first
const mockSupabaseClient = {
    from: vi.fn()
};

// Mock the module
vi.mock('../../services/supabase/client', () => ({
    withSupabase: vi.fn(async (cb, fallback) => {
        try {
            return await cb(mockSupabaseClient);
        } catch {
            return fallback;
        }
    }),
}));

const createBuilder = (tableName: string) => {
    const builder = {
        select: vi.fn((_cols) => {
            const query = {
                eq: vi.fn(() => query),
                order: vi.fn(() => query),
                limit: vi.fn(() => query),
                in: vi.fn(() => query),
                // biome-ignore lint/suspicious/noThenProperty: mocking promise
                then: (resolve: (arg: unknown) => void) => {
                    let data: unknown[] = [];
                    if (tableName === 'cat_tournament_selections') data = mockSelections;
                    if (tableName === 'cat_name_ratings') data = mockRatings;
                    if (tableName === 'cat_name_options') data = mockNames;
                    resolve({ data, error: null });
                }
            };
            return query;
        })
    };
    return builder;
};

const tableBuilders: Record<string, ReturnType<typeof createBuilder>> = {};

// Implement from
mockSupabaseClient.from.mockImplementation((table: string) => {
    if (!tableBuilders[table]) {
        tableBuilders[table] = createBuilder(table);
    }
    return tableBuilders[table];
});

describe('analyticsAPI.getPopularityScores', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear properties of tableBuilders without reassigning
        for (const key in tableBuilders) delete tableBuilders[key];
    });

    it('fetches data and calculates scores', async () => {
        const result = await analyticsAPI.getPopularityScores(5, 'all');

        expect(result).toHaveLength(5);

        // Verify queries
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('cat_tournament_selections');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('cat_name_ratings');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('cat_name_options');

        const selectionsBuilder = tableBuilders['cat_tournament_selections'];
        const ratingsBuilder = tableBuilders['cat_name_ratings'];
        const namesBuilder = tableBuilders['cat_name_options'];

        if (!selectionsBuilder || !ratingsBuilder || !namesBuilder) {
            throw new Error('Builders not initialized');
        }

        // Verify Selections Query
        expect(selectionsBuilder.select).toHaveBeenCalledTimes(1);
        expect(selectionsBuilder.select).toHaveBeenCalledWith('name_id');

        // Verify Ratings Query
        expect(ratingsBuilder.select).toHaveBeenCalledTimes(1);
        expect(ratingsBuilder.select).toHaveBeenCalledWith('name_id, rating, wins');

        // Verify Names Query (Called twice: once for IDs, once for details)
        expect(namesBuilder.select).toHaveBeenCalledTimes(2);
        expect(namesBuilder.select).toHaveBeenNthCalledWith(1, 'id');
        expect(namesBuilder.select).toHaveBeenNthCalledWith(2, 'id, name, description, avg_rating, categories, created_at');
    });
});
