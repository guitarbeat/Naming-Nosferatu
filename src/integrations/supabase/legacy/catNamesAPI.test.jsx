import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

const fromMock = vi.fn();

vi.mock('./supabaseClientIsolated.js', () => ({
  supabase: {
    from: fromMock
  }
}));

const { catNamesAPI } = await import('./catNamesAPI.js');

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('catNamesAPI.getNamesWithDescriptions', () => {
  beforeEach(() => {
    fromMock.mockReset();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('returns all names when no hidden ids exist', async () => {
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null })
    };

    const visibleNames = [{ id: 1, name: 'Mittens' }];

    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: visibleNames, error: null })
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

  it('excludes hidden ids and quotes string values safely', async () => {
    const hiddenIds = [42, 'alpha', '550e8400-e29b-41d4-a716-446655440000'];

    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: hiddenIds.map(id => ({ name_id: id })),
        error: null
      })
    };

    const visibleNames = [
      { id: 7, name: 'Visible Cat' },
      { id: 9, name: 'Another Cat' }
    ];

    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: visibleNames, error: null })
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
    expect(namesQuery.not).toHaveBeenCalledWith(
      'id',
      'in',
      "('42','alpha','550e8400-e29b-41d4-a716-446655440000')"
    );
    expect(namesQuery.order).toHaveBeenCalledWith('name', { ascending: true });
  });

  it('escapes single quotes in hidden ids when building the filter', async () => {
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ name_id: "O'Malley" }, { name_id: 5 }],
        error: null
      })
    };

    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
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

    await catNamesAPI.getNamesWithDescriptions();

    expect(namesQuery.not).toHaveBeenCalledWith(
      'id',
      'in',
      "('O''Malley','5')"
    );
  });

  it('returns an empty array and logs when the names query fails', async () => {
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null })
    };

    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('boom') })
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
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('queries the correct "cat_names" table', async () => {
    const hiddenQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null })
    };
    const namesQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      not: vi.fn().mockReturnThis()
    };

    fromMock.mockImplementation(table => {
      if (table === 'cat_name_ratings') {
        return hiddenQuery;
      }
      if (table === 'cat_names') {
        return namesQuery;
      }
      // Return a dummy mock for any other table to avoid errors in the test
      return {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    await catNamesAPI.getNamesWithDescriptions();

    const fromMockCalls = fromMock.mock.calls;
    const calledTables = fromMockCalls.map(call => call[0]);
    expect(calledTables).toContain('cat_names');
  });
});
