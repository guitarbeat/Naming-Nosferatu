import { beforeEach, describe, expect, it, vi } from "vitest";
import { withSupabase } from "@/services/supabase/client";
import { leaderboardAPI } from "./analyticsService";

// Mock the withSupabase helper
vi.mock("@/services/supabase/client", () => ({
	withSupabase: vi.fn(),
}));

describe("leaderboardAPI", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should call get_leaderboard_stats RPC and map results correctly", async () => {
		const mockRpcData = [
			{
				name_id: "id-1",
				name: "Cat 1",
				description: "Desc 1",
				category: "Funny",
				avg_rating: 1600,
				total_ratings: 10,
				wins: 5,
				losses: 5,
				created_at: "2023-01-01",
			},
			{
				name_id: "id-2",
				name: "Cat 2",
				description: "Desc 2",
				category: "Cute",
				avg_rating: 1500,
				total_ratings: 0,
				wins: 0,
				losses: 0,
				created_at: "2023-01-02",
			},
		];

		const mockClient = {
			rpc: vi.fn().mockResolvedValue({ data: mockRpcData, error: null }),
		};

		// Mock withSupabase to immediately execute the callback with the mock client
		(withSupabase as any).mockImplementation(async (callback: any) => {
			return callback(mockClient);
		});

		const result = await leaderboardAPI.getLeaderboard(25);

		expect(mockClient.rpc).toHaveBeenCalledWith("get_leaderboard_stats", {
			p_limit: 25,
		});

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name_id: "id-1",
			name: "Cat 1",
			description: "Desc 1",
			category: "Funny",
			avg_rating: 1600,
			total_ratings: 10,
			wins: 5,
			losses: 5,
			created_at: "2023-01-01",
		});
	});

	it("should handle RPC errors gracefully", async () => {
		const mockClient = {
			rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "RPC failed" } }),
		};

		(withSupabase as any).mockImplementation(async (callback: any) => {
			return callback(mockClient);
		});

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* ignore */
    });

		const result = await leaderboardAPI.getLeaderboard(50);

		expect(mockClient.rpc).toHaveBeenCalledWith("get_leaderboard_stats", {
			p_limit: 50,
		});
		expect(result).toEqual([]);
		expect(consoleSpy).toHaveBeenCalledWith("Error fetching leaderboard:", {
			message: "RPC failed",
		});

		consoleSpy.mockRestore();
	});
});
