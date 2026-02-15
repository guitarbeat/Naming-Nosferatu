import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock localStorage before imports
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	clear: vi.fn(),
	removeItem: vi.fn(),
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });
vi.stubGlobal("navigator", { onLine: true });

// Mock dependencies
vi.mock("../../services/supabase/client", () => {
	return {
		withSupabase: vi.fn(async (callback: any, _fallback: any) => {
			const client = {
				rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
				from: vi.fn().mockReturnValue({
					select: vi.fn().mockReturnValue({
						in: vi.fn().mockResolvedValue({ data: [], error: null }),
						upsert: vi.fn().mockResolvedValue({ error: null }),
						eq: vi.fn().mockReturnThis(),
						gte: vi.fn().mockReturnThis(),
						order: vi.fn().mockReturnThis(),
					}),
				}),
			};
			return callback(client);
		}),
		supabase: {},
	};
});

import { invalidateNameCache, tournamentsAPI } from "../../services/coreServices";
import { withSupabase } from "../../services/supabase/client";
// Import after mocks
import { analyticsAPI, leaderboardAPI, statsAPI } from "./analyticsService";

describe("Optimization Verification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		invalidateNameCache();
	});

	it("getTopSelectedNames should call get_top_selections RPC", async () => {
		let capturedClient: any;
		(withSupabase as any).mockImplementation(async (cb: any) => {
			capturedClient = {
				rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
			};
			return cb(capturedClient);
		});

		await analyticsAPI.getTopSelectedNames(10);
		expect(capturedClient.rpc).toHaveBeenCalledWith("get_top_selections", { limit_count: 10 });
	});

	it("getPopularityScores should call get_popularity_scores RPC", async () => {
		let capturedClient: any;
		(withSupabase as any).mockImplementation(async (cb: any) => {
			capturedClient = {
				rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
			};
			return cb(capturedClient);
		});

		await analyticsAPI.getPopularityScores(15, "current", "testuser");
		expect(capturedClient.rpc).toHaveBeenCalledWith("get_popularity_scores", {
			p_limit: 15,
			p_user_filter: "current",
			p_current_user_name: "testuser",
		});
	});

	it("getSiteStats should call get_site_stats RPC", async () => {
		let capturedClient: any;
		(withSupabase as any).mockImplementation(async (cb: any) => {
			capturedClient = {
				rpc: vi.fn().mockResolvedValue({ data: {}, error: null }),
			};
			return cb(capturedClient);
		});

		await statsAPI.getSiteStats();
		expect(capturedClient.rpc).toHaveBeenCalledWith("get_site_stats");
	});

	it("getLeaderboard should call get_leaderboard_stats RPC", async () => {
		let capturedClient: any;
		(withSupabase as any).mockImplementation(async (cb: any) => {
			capturedClient = {
				rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
			};
			return cb(capturedClient);
		});

		await leaderboardAPI.getLeaderboard(50);
		expect(capturedClient.rpc).toHaveBeenCalledWith("get_leaderboard_stats", { limit_count: 50 });
	});

	it("saveTournamentRatings should use caching", async () => {
		let capturedClient: any;

		const mockIn = vi.fn().mockResolvedValue({
			data: [{ id: "123", name: "Cat1" }],
			error: null,
		});
		const mockSelect = vi.fn().mockReturnValue({ in: mockIn });
		const mockFrom = vi.fn().mockReturnValue({
			select: mockSelect,
			upsert: vi.fn().mockResolvedValue({ error: null }),
		});

		(withSupabase as any).mockImplementation(async (cb: any) => {
			capturedClient = {
				from: mockFrom,
			};
			return cb(capturedClient);
		});

		// First call: should query DB
		await tournamentsAPI.saveTournamentRatings("user1", [{ name: "Cat1", rating: 1500 }]);

		expect(mockSelect).toHaveBeenCalledWith("id, name");
		expect(mockIn).toHaveBeenCalledWith("name", ["Cat1"]);

		mockSelect.mockClear();
		mockIn.mockClear();

		// Second call: should NOT query DB for "Cat1" as it is cached
		await tournamentsAPI.saveTournamentRatings("user1", [{ name: "Cat1", rating: 1600 }]);
		expect(mockSelect).not.toHaveBeenCalled();

		// Third call: new name "Cat2", should query DB only for "Cat2"
		mockIn.mockResolvedValue({
			data: [{ id: "456", name: "Cat2" }],
			error: null,
		});

		await tournamentsAPI.saveTournamentRatings("user1", [
			{ name: "Cat1", rating: 1600 },
			{ name: "Cat2", rating: 1500 },
		]);

		expect(mockSelect).toHaveBeenCalled();
		expect(mockIn).toHaveBeenCalledWith("name", ["Cat2"]);
	});
});
