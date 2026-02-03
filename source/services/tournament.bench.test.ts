import { describe, it, expect, vi } from 'vitest';
import { tournamentsAPI } from './tournament';
import * as SupabaseClient from './supabase/client';

// Mock the module
vi.mock('./supabase/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    withSupabase: vi.fn(),
  };
});

describe('saveTournamentRatings', () => {
  it('passes duplicate names to .in()', async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: [] });
    const mockSelect = vi.fn().mockReturnValue({
        in: mockIn
    });
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockClient = {
      from: mockFrom
    };

    // Mock implementation of withSupabase to just run the callback with mockClient
    (SupabaseClient.withSupabase as any).mockImplementation(async (callback) => {
      return callback(mockClient);
    });

    const ratings = [
      { name: 'Cat1', rating: 1000 },
      { name: 'Cat1', rating: 1200 }, // Duplicate
      { name: 'Cat2', rating: 1100 }
    ];

    // Pass true for skipQueue to bypass offline check
    await tournamentsAPI.saveTournamentRatings('user', ratings, true);

    expect(mockFrom).toHaveBeenCalledWith('cat_name_options');
    expect(mockSelect).toHaveBeenCalledWith('id, name');
    expect(mockIn).toHaveBeenCalledWith('name', expect.anything());

    const args = mockIn.mock.calls[0][1];
    // Should be deduplicated
    expect(args).toHaveLength(2);
    expect(args).toEqual(['Cat1', 'Cat2']);
  });
});
