import { describe, expect, it } from "vitest";
import {
	calculateTournamentMetrics,
	deriveBracketState,
	EloRating,
	generateRandomTeams,
	resolveTournamentMode,
} from "./tournamentEngine";

describe("tournamentEngine", () => {
	describe("EloRating", () => {
		it("calculates expected score correctly for equal ratings", () => {
			const elo = new EloRating();
			const expected = elo.getExpectedScore(1200, 1200);
			expect(expected).toBeCloseTo(0.5, 2);
		});

		it("calculates new ratings when left wins", () => {
			const elo = new EloRating();
			const result = elo.calculateNewRatings(1200, 1200, "left");
			expect(result.newRatingA).toBeGreaterThan(1200);
			expect(result.newRatingB).toBeLessThan(1200);
			expect(result.winsA).toBe(1);
			expect(result.lossesB).toBe(1);
		});
	});

	describe("resolveTournamentMode", () => {
		it("returns 2v2 when count is divisible by 4 (>=4)", () => {
			expect(resolveTournamentMode(4)).toBe("2v2");
			expect(resolveTournamentMode(8)).toBe("2v2");
			expect(resolveTournamentMode(16)).toBe("2v2");
		});

		it("returns 1v1 when count is not divisible by 4", () => {
			expect(resolveTournamentMode(2)).toBe("1v1");
			expect(resolveTournamentMode(3)).toBe("1v1");
			expect(resolveTournamentMode(5)).toBe("1v1");
			expect(resolveTournamentMode(6)).toBe("1v1");
		});
	});

	describe("generateRandomTeams", () => {
		it("pairs items into teams of 2", () => {
			const items = [
				{ id: "1", name: "Cat A" },
				{ id: "2", name: "Cat B" },
				{ id: "3", name: "Cat C" },
				{ id: "4", name: "Cat D" },
			];
			const teams = generateRandomTeams(items);
			expect(teams).toHaveLength(2);
			expect(teams[0]?.memberIds).toHaveLength(2);
			expect(teams[1]?.memberIds).toHaveLength(2);
		});
	});

	describe("deriveBracketState and calculateTournamentMetrics", () => {
		it("derives bracket state for 4 entrants", () => {
			const entrants = ["cat-1", "cat-2", "cat-3", "cat-4"];
			const derived = deriveBracketState(entrants, []);
			expect(derived.isComplete).toBe(false);
			expect(derived.pendingMatchIds).toEqual({
				leftId: "cat-1",
				rightId: "cat-2",
			});

			const metrics = calculateTournamentMetrics({ derived });
			expect(metrics.totalMatches).toBe(3);
			expect(metrics.matchNumber).toBe(1);
			expect(metrics.progress).toBe(0);
		});
	});
});
