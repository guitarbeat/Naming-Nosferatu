import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateSelectionStats } from "./useProfile";
import { resolveSupabaseClient } from "@supabase/client";

// Mock the dependencies
vi.mock("@supabase/client", () => ({
  resolveSupabaseClient: vi.fn(),
}));

describe("calculateSelectionStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deduplicate name IDs when querying categories", async () => {
    // Setup spies
    const orderSpy = vi.fn().mockResolvedValue({
      data: [
        { name_id: "101", tournament_id: "t1", selected_at: "2023-01-01", user_name: "u1" },
        { name_id: "101", tournament_id: "t2", selected_at: "2023-01-02", user_name: "u1" }, // Duplicate ID
        { name_id: "102", tournament_id: "t3", selected_at: "2023-01-03", user_name: "u1" },
      ],
      error: null,
    });

    const eqSpy = vi.fn().mockReturnValue({ order: orderSpy });
    const selectSelectionsSpy = vi.fn().mockReturnValue({ eq: eqSpy });

    const inSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    const selectOptionsSpy = vi.fn().mockReturnValue({ in: inSpy });

    const mockSupabase = {
      from: vi.fn((table) => {
        if (table === "cat_tournament_selections") {
          return { select: selectSelectionsSpy };
        }
        if (table === "cat_name_options") {
          return { select: selectOptionsSpy };
        }
        return { select: vi.fn() };
      }),
    };

    (resolveSupabaseClient as any).mockResolvedValue(mockSupabase);

    // Act
    await calculateSelectionStats("testuser");

    // Assert
    // Check if resolveSupabaseClient was called
    expect(resolveSupabaseClient).toHaveBeenCalled();

    // Check if the first query for selections was made
    expect(mockSupabase.from).toHaveBeenCalledWith("cat_tournament_selections");
    expect(selectSelectionsSpy).toHaveBeenCalled();
    expect(eqSpy).toHaveBeenCalledWith("user_name", "testuser");
    expect(orderSpy).toHaveBeenCalled();

    // Check if the second query for categories was made
    expect(mockSupabase.from).toHaveBeenCalledWith("cat_name_options");
    expect(selectOptionsSpy).toHaveBeenCalledWith("categories");

    // Verify deduplication
    // Expect unique IDs "101" and "102".
    // If not deduplicated, it would be ["101", "101", "102"] (length 3)
    // We expect length 2.
    expect(inSpy).toHaveBeenCalled();
    const calledIds = inSpy.mock.calls[0][1];
    expect(calledIds).toHaveLength(2);
    expect(calledIds).toContain("101");
    expect(calledIds).toContain("102");
  });
});
