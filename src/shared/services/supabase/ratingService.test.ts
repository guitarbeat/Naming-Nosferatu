import { beforeEach, describe, expect, it, vi } from "vitest";
import { ratingsAPI } from "./ratingService";
import { withSupabaseOrThrow } from "./runtime";

vi.mock("./runtime", () => ({
	withSupabaseOrThrow: vi.fn(),
}));

describe("ratingsAPI", () => {
	describe("applyTournamentMatch", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should successfully apply tournament match elo and parse response", async () => {
			const mockClient = {
				rpc: vi.fn().mockResolvedValue({
					data: [
						{ name_id: "id1", rating: 1600, wins: 1, losses: 0 },
						{ name_id: "id2", rating: 1400, wins: 0, losses: 1 },
						{ name_id: "id3", rating: null, wins: null, losses: null },
					],
					error: null,
				}),
			};

			vi.mocked(withSupabaseOrThrow).mockImplementation(async (callback) => {
				return callback(mockClient as any);
			});

			const params = {
				userName: "TestUser",
				leftNameIds: ["id1"],
				rightNameIds: ["id2"],
				winnerSide: "left" as const,
			};

			const result = await ratingsAPI.applyTournamentMatch(params);

			expect(result).toEqual({
				id1: { rating: 1600, wins: 1, losses: 0 },
				id2: { rating: 1400, wins: 0, losses: 1 },
				id3: { rating: 1500, wins: 0, losses: 0 },
			});
			expect(mockClient.rpc).toHaveBeenCalledWith(
				"apply_tournament_match_elo",
				{
					p_user_name: "TestUser",
					p_left_name_ids: ["id1"],
					p_right_name_ids: ["id2"],
					p_winner_side: "left",
				},
			);
		});

		it("should throw when the RPC call returns an error", async () => {
			const mockClient = {
				rpc: vi.fn().mockResolvedValue({
					data: null,
					error: { message: "Failed to apply tournament Elo update" },
				}),
			};

			vi.mocked(withSupabaseOrThrow).mockImplementation(async (callback) => {
				return callback(mockClient as any);
			});

			const params = {
				userName: "TestUser",
				leftNameIds: ["id1"],
				rightNameIds: ["id2"],
				winnerSide: "left" as const,
			};

			await expect(ratingsAPI.applyTournamentMatch(params)).rejects.toThrow(
				"Failed to apply tournament Elo update",
			);
			expect(mockClient.rpc).toHaveBeenCalledWith(
				"apply_tournament_match_elo",
				{
					p_user_name: "TestUser",
					p_left_name_ids: ["id1"],
					p_right_name_ids: ["id2"],
					p_winner_side: "left",
				},
			);
		});
	});
});

describe("saveRatings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should pass the correct arguments to save_user_ratings", async () => {
		const mockClient = {
			rpc: vi.fn().mockResolvedValue({
				data: { success: true, count: 1 },
				error: null,
			}),
		};

		vi.mocked(withSupabaseOrThrow).mockImplementation(async (callback) => {
			return callback(mockClient as any);
		});

		const ratings = {
			id1: { rating: 1600, wins: 1, losses: 0 },
		};

		const result = await ratingsAPI.saveRatings("TestUser", ratings);

		expect(result).toEqual({ success: true, count: 1 });
		expect(mockClient.rpc).toHaveBeenCalledWith("save_user_ratings", {
			p_user_name: "TestUser",
			p_ratings: [{ nameId: "id1", rating: 1600, wins: 1, losses: 0 }],
		});
	});

	it("should properly surface server-side exception when anonymous caller attempts to spoof authenticated user", async () => {
		// This tests that the client properly handles the RPC error string
		// produced by the newly added SQL exception: 'Cannot use registered user name as anonymous caller'
		const mockClient = {
			rpc: vi.fn().mockResolvedValue({
				data: null,
				error: {
					message: "Cannot use registered user name as anonymous caller",
				},
			}),
		};

		vi.mocked(withSupabaseOrThrow).mockImplementation(async (callback) => {
			return callback(mockClient as any);
		});

		const ratings = {
			id1: { rating: 1600, wins: 1, losses: 0 },
		};

		await expect(
			ratingsAPI.saveRatings("SpoofedUser", ratings),
		).rejects.toThrow("Cannot use registered user name as anonymous caller");

		expect(mockClient.rpc).toHaveBeenCalledWith("save_user_ratings", {
			p_user_name: "SpoofedUser",
			p_ratings: [{ nameId: "id1", rating: 1600, wins: 1, losses: 0 }],
		});
	});
});
