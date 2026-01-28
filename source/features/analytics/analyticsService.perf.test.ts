import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsAPI } from './analyticsService';
import * as supabaseClientModule from '@services/supabase/client';

// Mock the dependencies
vi.mock('@services/supabase/client', () => ({
  withSupabase: vi.fn(),
}));

describe('analyticsAPI.getRankingHistory performance', () => {
  let mockClient: any;
  let fromMock: any;
  let inMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock chain
    inMock = vi.fn().mockReturnThis();

    // Default chain for generic calls
    const defaultChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: inMock,
      then: vi.fn((resolve) => resolve({ data: [] })),
    };

    // Chain for selections
    const selectionsChain = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
            { name_id: '1', name: 'Cat 1', selected_at: new Date().toISOString() },
            { name_id: '2', name: 'Cat 2', selected_at: new Date().toISOString() }
        ],
        error: null
      }),
    };

    // Chain for ratings
    const ratingsChain = {
        select: vi.fn().mockReturnValue({
            // If .in() is called, it should return this object too, effectively.
            // But we need to handle if .in() is NOT called.
            // The code calls await client.from().select()
            // If optimized, it will be await client.from().select().in()
            in: inMock,
            then: vi.fn((resolve) => resolve({
                data: [
                    { name_id: '1', rating: 1600, wins: 5 },
                    { name_id: '2', rating: 1400, wins: 2 },
                    { name_id: '3', rating: 1500, wins: 0 } // Extra data that shouldn't matter if filtered
                ]
            })),
        })
    };

    // We need the ratings chain to support .in() returning the promise
    ratingsChain.select.mockReturnValue({
        in: inMock,
        // If they await select() directly (unoptimized)
        then: vi.fn((resolve) => resolve({
             data: [
                { name_id: '1', rating: 1600, wins: 5 },
                { name_id: '2', rating: 1400, wins: 2 },
                { name_id: '3', rating: 1500, wins: 0 }
            ]
        }))
    });

    // Update inMock to return the promise-like object
    inMock.mockReturnValue({
         then: vi.fn((resolve) => resolve({
             data: [
                { name_id: '1', rating: 1600, wins: 5 },
                { name_id: '2', rating: 1400, wins: 2 }
            ]
        }))
    });

    fromMock = vi.fn((table) => {
        if (table === 'cat_tournament_selections') return selectionsChain;
        if (table === 'cat_name_ratings') return ratingsChain;
        return defaultChain;
    });

    mockClient = {
      from: fromMock,
    };

    // Mock withSupabase to execute the callback with our mock client
    (supabaseClientModule.withSupabase as any).mockImplementation(async (cb: any) => {
      return cb(mockClient);
    });
  });

  it('should filter ratings query by name_id', async () => {
    await analyticsAPI.getRankingHistory(10, 7);

    // Verify selections were fetched
    expect(fromMock).toHaveBeenCalledWith('cat_tournament_selections');

    // Verify ratings were fetched
    expect(fromMock).toHaveBeenCalledWith('cat_name_ratings');

    // Verify that .in() was called on the ratings query
    // This expects the optimization to be present.
    // It will FAIL before the optimization.
    expect(inMock).toHaveBeenCalled();

    // Verify arguments to .in()
    // It should be 'name_id' and an array containing '1' and '2' (strings)
    const args = inMock.mock.calls[0];
    expect(args[0]).toBe('name_id');
    expect(args[1]).toEqual(expect.arrayContaining(['1', '2']));
    expect(args[1]).not.toContain('3');
  });
});
