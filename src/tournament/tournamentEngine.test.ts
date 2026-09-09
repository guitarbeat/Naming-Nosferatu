import { describe, expect, it } from "vitest";
import {
	calculateTournamentMetrics,
	calculateWinStreak,
	createMatchRecord,
	EloRating,
	getBracketStageLabel,
	getFlameCount,
	getHeatLevel,
	resolveTournamentMode,
} from "./tournamentEngine";

describe("tournamentEngine", () => {
	it("resolves tournament mode correctly based on entrant count", () => {
		expect(resolveTournamentMode(4)).toBe("2v2");
		expect(resolveTournamentMode(8)).toBe("2v2");
		expect(resolveTournamentMode(5)).toBe("1v1");
		expect(resolveTournamentMode(3)).toBe("1v1");
	});

	it("calculates expected Elo score", () => {
		const elo = new EloRating(1200, 32);
		expect(elo.getExpectedScore(1200, 1200)).toBeCloseTo(0.5);
		expect(elo.getExpectedScore(1400, 1200)).toBeGreaterThan(0.5);
		expect(elo.getExpectedScore(1200, 1400)).toBeLessThan(0.5);
	});

	it("updates Elo ratings on match win", () => {
		const elo = new EloRating(1200, 32);
		const result = elo.calculateNewRatings(1200, 1200, "left");
		expect(result.newRatingA).toBeGreaterThan(1200);
		expect(result.newRatingB).toBeLessThan(1200);
		expect(result.winsA).toBe(1);
		expect(result.lossesB).toBe(1);
	});

	it("labels bracket stages properly", () => {
		expect(getBracketStageLabel(3, 3)).toBe("Final");
		expect(getBracketStageLabel(2, 3)).toBe("Semifinal");
		expect(getBracketStageLabel(1, 3)).toBe("Quarterfinal");
	});

	it("evaluates heat level from streak thresholds", () => {
		expect(getHeatLevel(1)).toBeNull();
		expect(getHeatLevel(3)).toBe("warm");
		expect(getHeatLevel(5)).toBe("hot");
		expect(getHeatLevel(8)).toBe("blazing");
	});

	it("calculates flame counts", () => {
		expect(getFlameCount(0)).toBe(3);
		expect(getFlameCount(3)).toBe(4);
		expect(getFlameCount(12, 8)).toBe(8);
	});

	it("creates valid match records", () => {
		const record = createMatchRecord({
			currentMatch: {
				mode: "1v1",
				left: "1",
				right: "2",
			},
			winnerId: "1",
			loserId: "2",
			matchNumber: 1,
			round: 1,
		});

		expect(record.winner).toBe("1");
		expect(record.loser).toBe("2");
		expect(record.matchNumber).toBe(1);
	});

	it("calculates win streaks from match history", () => {
		const history = [
			{
				match: {
					mode: "1v1" as const,
					left: "cat-1",
					right: "cat-2",
				},
				winner: "cat-1",
				loser: "cat-2",
				voteType: "normal" as const,
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			},
			{
				match: {
					mode: "1v1" as const,
					left: "cat-1",
					right: "cat-3",
				},
				winner: "cat-1",
				loser: "cat-3",
				voteType: "normal" as const,
				matchNumber: 2,
				roundNumber: 1,
				timestamp: Date.now(),
			},
		];
		expect(calculateWinStreak("cat-1", history)).toBe(2);
		expect(calculateWinStreak("cat-2", history)).toBe(0);
	});

	it("calculates tournament progress metrics", () => {
		const metrics = calculateTournamentMetrics({
			derived: {
				round: 1,
				totalRounds: 3,
				stageLabel: "Quarterfinal",
				roundSize: 8,
				totalMatches: 4,
				completedMatches: 2,
				isComplete: false,
				pendingMatchIds: null,
			},
		});
		expect(metrics.progress).toBe(50);
		expect(metrics.totalMatches).toBe(4);
		expect(metrics.completedMatches).toBe(2);
	});
});
