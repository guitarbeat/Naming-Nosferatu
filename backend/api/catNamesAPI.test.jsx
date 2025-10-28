import { describe, expect, it, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();

vi.mock('./supabaseClientIsolated.js', () => ({
  supabase: {
    from: fromMock,
  },
}));

const { catNamesAPI } = await import('./catNamesAPI.js');

describe('catNamesAPI.getNamesWithDescriptions', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns all names when no hidden ids exist', async () => {
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const visibleNames = [{ id: 1, name: 'Mittens' }];

    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: visibleNames, error: null }),
    };

    fromMock.mockImplementation(table => {
      if (table === 'cat_name_ratings') {
        return hiddenQuery;
      }
      if (table === 'cat_names') {
        return namesQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await catNamesAPI.getNamesWithDescriptions();

    expect(result).toEqual(visibleNames);
    expect(namesQuery.not).not.toHaveBeenCalled();
    expect(namesQuery.order).toHaveBeenCalledWith('name', { ascending: true });
  });
});
