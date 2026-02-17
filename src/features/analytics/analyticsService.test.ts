import { beforeEach, describe, expect, it, vi } from "vitest";
import * as clientModule from "@/services/supabase/client";
import { leaderboardAPI, statsAPI } from "./analyticsService";

// Mock the entire client module
vi.mock("@/services/supabase/client", () => ({
	withSupabase: vi.fn(),
	isSupabaseAvailable: vi.fn().mockResolvedValue(true),
}));

describe("analyticsService", () => {
	let mockSupabase: any;
	let mockQueryBuilder: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockQueryBuilder = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			// biome-ignore lint/suspicious/noThenProperty: Mocking a thenable
			then: vi.fn((resolve) => resolve({ data: [], error: null })),
		};

		mockSupabase = {
			from: vi.fn().mockReturnValue(mockQueryBuilder),
			rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
		};

		(clientModule.withSupabase as any).mockImplementation(async (callback: any) => {
			return callback(mockSupabase);
		});
	});

	describe("statsAPI.getSiteStats", () => {
		it("should use get_site_stats RPC", async () => {
			mockSupabase.rpc.mockResolvedValue({
				data: [
					{
						total_names: 10,
						hidden_names: 1,
						active_names: 9,
						total_users: 5,
						total_ratings: 20,
						total_selections: 30,
						avg_rating: 1500,
					},
				],
				error: null,
			});
			await statsAPI.getSiteStats();
			expect(mockSupabase.rpc).toHaveBeenCalledWith("get_site_stats");
		});
	});

	describe("leaderboardAPI.getLeaderboard", () => {
		it("should use efficient get_leaderboard_stats RPC", async () => {
			mockSupabase.rpc.mockResolvedValue({
				data: [],
				error: null,
			});
			await leaderboardAPI.getLeaderboard();

			// Check if it calls the RPC
			expect(mockSupabase.rpc).toHaveBeenCalledWith("get_leaderboard_stats", { limit_count: 50 });
			// It should NOT call the table directly
			expect(mockSupabase.from).not.toHaveBeenCalledWith("cat_name_ratings");
		});
	});
});
