import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsAPI, leaderboardAPI } from "@/services/analytics/analyticsService";
import { api } from "@/services/apiClient";

vi.mock("@/services/apiClient", () => ({
	api: {
		get: vi.fn(),
	},
}));

describe("leaderboardAPI", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls analytics leaderboard endpoint and maps rows", async () => {
		const mockRows = [
			{
				name_id: "id-1",
				name: "Cat 1",
				avg_rating: 1600,
				wins: 5,
				total_ratings: 10,
				created_at: "2023-01-01",
			},
			{
				id: "id-2",
				name: "Cat 2",
				avg_rating: 1500,
				wins: 0,
				total_ratings: 0,
				date_submitted: "2023-01-02",
			},
		];

		vi.mocked(api.get).mockResolvedValueOnce(mockRows as never);

		const result = await leaderboardAPI.getLeaderboard(25);

		expect(api.get).toHaveBeenCalledWith("/analytics/leaderboard?limit=25");
		expect(result).toEqual([
			{
				name_id: "id-1",
				name: "Cat 1",
				avg_rating: 1600,
				wins: 5,
				total_ratings: 10,
				created_at: "2023-01-01",
				date_submitted: null,
			},
			{
				name_id: "id-2",
				name: "Cat 2",
				avg_rating: 1500,
				wins: 0,
				total_ratings: 0,
				created_at: null,
				date_submitted: "2023-01-02",
			},
		]);
	});

	it("maps camelCase leaderboard rows returned by the Express server", async () => {
		vi.mocked(api.get).mockResolvedValueOnce([
			{
				nameId: "id-3",
				name: "Cat 3",
				avgRating: 1710,
				totalWins: 8,
				totalVotes: 12,
				createdAt: "2023-01-03",
			},
		] as never);

		const result = await leaderboardAPI.getLeaderboard(10);

		expect(result).toEqual([
			{
				name_id: "id-3",
				name: "Cat 3",
				avg_rating: 1710,
				wins: 8,
				total_ratings: 12,
				created_at: "2023-01-03",
				date_submitted: null,
			},
		]);
	});

	it("returns empty array on API failure", async () => {
		vi.mocked(api.get).mockRejectedValueOnce(new Error("boom"));

		const result = await leaderboardAPI.getLeaderboard(50);

		expect(api.get).toHaveBeenCalledWith("/analytics/leaderboard?limit=50");
		expect(result).toEqual([]);
	});
});

describe("analyticsAPI", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("maps popularity score rows from the analytics endpoint", async () => {
		vi.mocked(api.get).mockResolvedValueOnce([
			{
				nameId: "id-4",
				name: "Cat 4",
				avgRating: 1655,
				totalWins: 6,
				timesSelected: 14,
			},
		] as never);

		const result = await analyticsAPI.getPopularityScores(8);

		expect(api.get).toHaveBeenCalledWith("/analytics/popularity-scores?limit=8");
		expect(result).toEqual([
			{
				name_id: "id-4",
				name: "Cat 4",
				avg_rating: 1655,
				total_wins: 6,
				times_selected: 14,
			},
		]);
	});
});
