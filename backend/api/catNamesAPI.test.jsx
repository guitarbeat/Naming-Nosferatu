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

  it('filters out hidden string ids with SQL-safe quoting', async () => {
    const hiddenId = '123e4567-e89b-12d3-a456-426614174000';
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ name_id: hiddenId }], error: null }),
    };

    const visibleNames = [{ id: 2, name: 'Whiskers' }];
  it('excludes names whose ids are hidden including string values', async () => {
    const hiddenIds = [42, 'alpha', '550e8400-e29b-41d4-a716-446655440000'];

    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: hiddenIds.map(id => ({ name_id: id })),
        error: null,
      }),
    };

    const visibleNames = [
      { id: 7, name: 'Visible Cat' },
      { id: 9, name: 'Another Cat' },
    ];

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
    expect(namesQuery.not).toHaveBeenCalledWith('id', 'in', `('${hiddenId}')`);
    expect(namesQuery.not).toHaveBeenCalledWith(
      'id',
      'in',
      `(${hiddenIds.join(',')})`
    );
    expect(namesQuery.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('returns empty array when names query fails', async () => {
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('boom') }),
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

    expect(result).toEqual([]);
    expect(namesQuery.order).toHaveBeenCalledWith('name', { ascending: true });
  });
});
