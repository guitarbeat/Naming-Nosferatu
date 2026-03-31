import { beforeEach, describe, expect, it, vi } from "vitest";
import { leaderboardAPI } from "@/features/analytics/services/analyticsService";
import { withSupabase } from "@/shared/services/supabase/runtime";

vi.mock("@/shared/services/supabase/runtime", () => ({
	withSupabase: vi.fn(),
	resolveSupabaseClient: vi.fn(),
}));

describe("leaderboardAPI", () => {
	const mockedWithSupabase = vi.mocked(withSupabase);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls get_leaderboard_stats RPC and maps rows", async () => {
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
				name_id: "id-2",
				name: "Cat 2",
				avg_rating: 1500,
				wins: 0,
				total_ratings: 0,
				date_submitted: "2023-01-02",
			},
		];

		mockedWithSupabase.mockResolvedValueOnce(
			mockRows.map((row) => ({
				name_id: String(row.name_id ?? ""),
				name: String(row.name ?? ""),
				avg_rating: Number(row.avg_rating ?? 0),
				wins: Number(row.wins ?? 0),
				total_ratings: Number(row.total_ratings ?? 0),
				created_at: (row as { created_at?: string }).created_at ?? null,
				date_submitted: (row as { date_submitted?: string }).date_submitted ?? null,
			})),
		);

		const result = await leaderboardAPI.getLeaderboard(25);

		expect(mockedWithSupabase).toHaveBeenCalled();
		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Cat 1");
		expect(result[0]?.avg_rating).toBe(1600);
		expect(result[1]?.name).toBe("Cat 2");
	});

	it("returns empty array when withSupabase fallback is returned", async () => {
		mockedWithSupabase.mockResolvedValueOnce([]);

		const result = await leaderboardAPI.getLeaderboard(50);

		expect(result).toEqual([]);
	});
});
