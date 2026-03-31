import { beforeEach, describe, expect, it, vi } from "vitest";
import { coreAPI, ratingsAPI } from "./api";
import { resolveSupabaseClient, withSupabase } from "./runtime";

vi.mock("./runtime", () => ({
	resolveSupabaseClient: vi.fn(),
	withSupabase: vi.fn(),
}));

describe("Supabase Service API", () => {
	const mockedResolveSupabaseClient = vi.mocked(resolveSupabaseClient);
	const mockedWithSupabase = vi.mocked(withSupabase);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("coreAPI.addName", () => {
		it("returns success when the add_cat_name RPC succeeds", async () => {
			const row = { id: "uuid-1", name: "Whiskers", description: "Fluffy", avg_rating: 1500 };
			mockedWithSupabase.mockResolvedValue({ success: true, data: row });

			const result = await coreAPI.addName("Whiskers", "Fluffy");

			expect(mockedWithSupabase).toHaveBeenCalled();
			expect(result.success).toBe(true);
		});

		it("returns the fallback value when the Supabase client is unavailable", async () => {
			mockedWithSupabase.mockResolvedValue({ success: false, error: "Supabase client not available" });

			const result = await coreAPI.addName("Ghost", "Spooky");

			expect(result.success).toBe(false);
			expect(result.error).toBe("Supabase client not available");
		});
	});

	describe("coreAPI.getTrendingNames", () => {
		it("returns names from Supabase when available", async () => {
			const mockData = [
				{ id: "uuid-2", name: "Luna", avg_rating: 1600, is_hidden: false },
			];
			const mockQuery = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			};
			mockedResolveSupabaseClient.mockResolvedValue(
				{ from: vi.fn().mockReturnValue(mockQuery) } as never,
			);

			const result = await coreAPI.getTrendingNames(false);

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("Luna");
		});

		it("filters hidden names when includeHidden=false", async () => {
			const mockData = [{ id: "uuid-3", name: "Shadow", avg_rating: 1490, is_hidden: false }];
			const mockQuery = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
			};
			mockedResolveSupabaseClient.mockResolvedValue(
				{ from: vi.fn().mockReturnValue(mockQuery) } as never,
			);

			await coreAPI.getTrendingNames(false);

			expect(mockQuery.eq).toHaveBeenCalledWith("is_hidden", false);
		});

		it("returns empty array when Supabase client is unavailable", async () => {
			mockedResolveSupabaseClient.mockResolvedValue(null);

			const result = await coreAPI.getTrendingNames();

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});
	});

	describe("coreAPI.hideName", () => {
		it("calls toggle_name_visibility RPC and returns success", async () => {
			const mockRpc = vi.fn()
				.mockResolvedValueOnce({ data: true, error: null }); // toggle_name_visibility

			mockedResolveSupabaseClient.mockResolvedValue({ rpc: mockRpc } as never);

			const result = await coreAPI.hideName("admin", "uuid-1", true);

			expect(mockRpc).toHaveBeenCalledWith(
				"toggle_name_visibility",
				expect.objectContaining({ p_name_id: "uuid-1", p_hide: true }),
			);
			expect(result.success).toBe(true);
		});

		it("does not call set_user_context (privilege escalation removed)", async () => {
			const mockRpc = vi.fn()
				.mockResolvedValueOnce({ data: true, error: null });

			mockedResolveSupabaseClient.mockResolvedValue({ rpc: mockRpc } as never);

			await coreAPI.hideName("admin", "uuid-1", true);

			expect(mockRpc).not.toHaveBeenCalledWith("set_user_context", expect.anything());
		});

		it("returns an error when the RPC fails (no silent fallback)", async () => {
			const mockRpc = vi.fn()
				.mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });

			mockedResolveSupabaseClient.mockResolvedValue({ rpc: mockRpc } as never);

			const result = await coreAPI.hideName("user", "uuid-2", true);

			expect(result.success).toBe(false);
			expect(result.error).toMatch(/permission denied/);
		});

		it("returns error when Supabase client is unavailable", async () => {
			mockedResolveSupabaseClient.mockResolvedValue(null);

			const result = await coreAPI.hideName("admin", "uuid-3", true);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Supabase client not available");
		});
	});

	describe("ratingsAPI.applyTournamentMatch", () => {
		it("calls the Elo RPC and maps the returned rows", async () => {
			const mockRpc = vi.fn().mockResolvedValue({
				data: [
					{ name_id: "left-1", rating: 1540, wins: 1, losses: 0 },
					{ name_id: "right-1", rating: 1460, wins: 0, losses: 1 },
				],
				error: null,
			});
			mockedResolveSupabaseClient.mockResolvedValue({ rpc: mockRpc } as never);

			const result = await ratingsAPI.applyTournamentMatch({
				userName: "aaron",
				leftNameIds: ["left-1"],
				rightNameIds: ["right-1"],
				winnerSide: "left",
			});

			expect(mockRpc).toHaveBeenCalledWith("apply_tournament_match_elo", {
				p_user_name: "aaron",
				p_left_name_ids: ["left-1"],
				p_right_name_ids: ["right-1"],
				p_winner_side: "left",
			});
			expect(result).toEqual({
				"left-1": { rating: 1540, wins: 1, losses: 0 },
				"right-1": { rating: 1460, wins: 0, losses: 1 },
			});
		});

		it("throws when the RPC returns an error", async () => {
			const mockRpc = vi.fn().mockResolvedValue({
				data: null,
				error: { message: "rpc failed" },
			});
			mockedResolveSupabaseClient.mockResolvedValue({ rpc: mockRpc } as never);

			await expect(
				ratingsAPI.applyTournamentMatch({
					userName: "aaron",
					leftNameIds: ["left-1"],
					rightNameIds: ["right-1"],
					winnerSide: "left",
				}),
			).rejects.toThrow("rpc failed");
		});

		it("throws when Supabase client is unavailable", async () => {
			mockedResolveSupabaseClient.mockResolvedValue(null);

			await expect(
				ratingsAPI.applyTournamentMatch({
					userName: "aaron",
					leftNameIds: ["x"],
					rightNameIds: ["y"],
					winnerSide: "left",
				}),
			).rejects.toThrow("Supabase client not available");
		});
	});
});
