import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

const { fromMock, supabaseMock } = vi.hoisted(() => {
  const fromMock = vi.fn();
  return {
    fromMock,
    supabaseMock: { from: fromMock },
  };
});

vi.mock("../client", () => ({
  resolveSupabaseClient: vi.fn(() => Promise.resolve(supabaseMock)),
}));

import { catNamesAPI } from "./catNamesAPI.js";

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("catNamesAPI.getNamesWithDescriptions", () => {
  beforeEach(() => {
    fromMock.mockReset();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("returns visible names when includeHidden is false (default)", async () => {
    const visibleNames = [
      { id: 1, name: "Mittens", is_hidden: false },
      { id: 2, name: "Whiskers", is_hidden: false },
    ];

    // Create a chainable mock that tracks calls
    const eqMock = vi
      .fn()
      .mockResolvedValue({ data: visibleNames, error: null });
    const orderMock = vi.fn().mockReturnValue({ eq: eqMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });

    fromMock.mockReturnValue({ select: selectMock });

    const result = await catNamesAPI.getNamesWithDescriptions();

    expect(result).toEqual(visibleNames);
    expect(fromMock).toHaveBeenCalledWith("cat_name_options");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(orderMock).toHaveBeenCalledWith("name", { ascending: true });
    expect(eqMock).toHaveBeenCalledWith("is_hidden", false);
  });

  it("returns all names including hidden when includeHidden is true", async () => {
    const allNames = [
      { id: 1, name: "Mittens", is_hidden: false },
      { id: 2, name: "Shadow", is_hidden: true },
    ];

    // When includeHidden is true, eq is not called, so order resolves directly
    const orderMock = vi
      .fn()
      .mockResolvedValue({ data: allNames, error: null });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });

    fromMock.mockReturnValue({ select: selectMock });

    const result = await catNamesAPI.getNamesWithDescriptions(true);

    expect(result).toEqual(allNames);
    expect(fromMock).toHaveBeenCalledWith("cat_name_options");
    expect(orderMock).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("returns an empty array and logs when the query fails", async () => {
    const eqMock = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error("Database error") });
    const orderMock = vi.fn().mockReturnValue({ eq: eqMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });

    fromMock.mockReturnValue({ select: selectMock });

    const result = await catNamesAPI.getNamesWithDescriptions();

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("queries the cat_name_options table", async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const orderMock = vi.fn().mockReturnValue({ eq: eqMock });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });

    fromMock.mockReturnValue({ select: selectMock });

    await catNamesAPI.getNamesWithDescriptions();

    expect(fromMock).toHaveBeenCalledWith("cat_name_options");
  });
});
