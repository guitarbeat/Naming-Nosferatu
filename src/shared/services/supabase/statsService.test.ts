import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeRatingStats, getPercentileRank } from "@/shared/lib/ratingStats";
import { withSupabase } from "./runtime";
import { leaderboardAPI } from "./statsService";

vi.mock("./runtime", () => ({
	withSupabase: vi.fn(),
	resolveSupabaseClient: vi.fn(),
}));

vi.mock("@/shared/lib/ratingStats", () => ({
	computeRatingStats: vi.fn(),
	getPercentileRank: vi.fn(),
}));

describe("leaderboardAPI", () => {
	const mockedWithSupabase = vi.mocked(withSupabase);
	const mockedComputeRatingStats = vi.mocked(computeRatingStats);
	const mockedGetPercentileRank = vi.mocked(getPercentileRank);

	let mockRpc: any;
	let mockClient: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockRpc = vi.fn();
		mockClient = {
			rpc: mockRpc,
		};

		// By default, execute the callback with our mock client
		mockedWithSupabase.mockImplementation(async (callback, fallback) => {
			try {
				return await callback(mockClient);
			} catch (_e) {
				return fallback;
			}
		});
	});

	it("calls get_leaderboard_stats RPC with correct limit and maps rows", async () => {
		const mockData = [
			{
				name_id: "id-1",
				name: "Cat 1",
				avg_rating: 1600,
				wins: 5,
				losses: 2,
				total_ratings: 10,
				created_at: "2023-01-01",
			},
			{
				name_id: "id-2",
				name: "Cat 2",
				avg_rating: 1500,
				wins: 0,
				losses: 0,
				total_ratings: 0,
				date_submitted: "2023-01-02",
			},
		];

		mockRpc.mockResolvedValueOnce({ data: mockData, error: null });

		mockedComputeRatingStats.mockReturnValue({
			mean: 1550,
			stdDev: 50,
			median: 1550,
			min: 1500,
			max: 1600,
			percentile90: 1590,
			percentile99: 1599,
		});

		mockedGetPercentileRank.mockImplementation((rating) => {
			if (rating === 1600) {
				return 99;
			}
			if (rating === 1500) {
				return 10;
			}
			return 50;
		});

		const result = await leaderboardAPI.getLeaderboard(25);

		expect(mockRpc).toHaveBeenCalledWith("get_leaderboard_stats", {
			limit_count: 25,
		});

		expect(mockedComputeRatingStats).toHaveBeenCalledWith([1600, 1500]);
		expect(mockedGetPercentileRank).toHaveBeenCalledTimes(2);

		expect(result).toHaveLength(2);

		// Check first mapped item
		expect(result[0]).toEqual(
			expect.objectContaining({
				name_id: "id-1",
				name: "Cat 1",
				avg_rating: 1600,
				wins: 5,
				losses: 2,
				total_ratings: 10,
				percentile_rank: 99,
				confidence: 10 / 15,
				created_at: "2023-01-01",
				date_submitted: null,
			}),
		);

		// Check second mapped item
		expect(result[1]).toEqual(
			expect.objectContaining({
				name_id: "id-2",
				name: "Cat 2",
				avg_rating: 1500,
				wins: 0,
				losses: 0,
				total_ratings: 0,
				percentile_rank: 10,
				confidence: 0,
				created_at: null,
				date_submitted: "2023-01-02",
			}),
		);
	});

	it("uses default limit 50 when limit is null", async () => {
		mockRpc.mockResolvedValueOnce({ data: [], error: null });

		await leaderboardAPI.getLeaderboard(null);

		expect(mockRpc).toHaveBeenCalledWith("get_leaderboard_stats", {
			limit_count: 50,
		});
	});

	it("returns empty array when RPC returns an error", async () => {
		mockRpc.mockResolvedValueOnce({ data: null, error: { message: "Database error" } });

		const result = await leaderboardAPI.getLeaderboard(50);

		expect(result).toEqual([]);
	});

	it("handles missing stats gracefully (confidence = 0)", async () => {
		const mockData = [
			{
				name_id: "id-1",
				name: "Cat 1",
				avg_rating: 1600,
				total_ratings: 20, // would be > 15, so confidence would normally be 1
			},
		];

		mockRpc.mockResolvedValueOnce({ data: mockData, error: null });

		// computeRatingStats returns null if there's an error or empty input
		mockedComputeRatingStats.mockReturnValue(null);

		const result = await leaderboardAPI.getLeaderboard(10);

		expect(result).toHaveLength(1);
		expect(result[0]?.confidence).toBe(0);
	});
});
