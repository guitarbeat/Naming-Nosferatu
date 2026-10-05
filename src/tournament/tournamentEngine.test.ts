import { describe, expect, it } from "vitest";
import type { MatchRecord } from "@/types";
import {
	calculateTournamentMetrics,
	calculateWinStreak,
	createMatchRecord,
	deriveBracketState,
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

	describe("getBracketStageLabel", () => {
		it("returns 'Final' when round equals totalRounds", () => {
			expect(getBracketStageLabel(1, 1)).toBe("Final");
			expect(getBracketStageLabel(2, 2)).toBe("Final");
			expect(getBracketStageLabel(3, 3)).toBe("Final");
			expect(getBracketStageLabel(5, 5)).toBe("Final");
		});

		it("returns 'Final' when round exceeds totalRounds", () => {
			expect(getBracketStageLabel(4, 3)).toBe("Final");
			expect(getBracketStageLabel(10, 5)).toBe("Final");
		});

		it("returns 'Semifinal' when remaining rounds equal 1", () => {
			expect(getBracketStageLabel(2, 3)).toBe("Semifinal");
			expect(getBracketStageLabel(4, 5)).toBe("Semifinal");
		});

		it("returns 'Quarterfinal' when remaining rounds equal 2", () => {
			expect(getBracketStageLabel(1, 3)).toBe("Quarterfinal");
			expect(getBracketStageLabel(3, 5)).toBe("Quarterfinal");
		});

		it("returns 'Round X' when remaining rounds are 3 or more", () => {
			expect(getBracketStageLabel(1, 4)).toBe("Round 1");
			expect(getBracketStageLabel(1, 5)).toBe("Round 1");
			expect(getBracketStageLabel(2, 5)).toBe("Round 2");
			expect(getBracketStageLabel(1, 10)).toBe("Round 1");
			expect(getBracketStageLabel(7, 10)).toBe("Round 7");
		});

		it("handles zero or negative rounds and totalRounds safely", () => {
			expect(getBracketStageLabel(0, 0)).toBe("Final");
			expect(getBracketStageLabel(-1, 3)).toBe("Quarterfinal");
			expect(getBracketStageLabel(1, -2)).toBe("Final");
			expect(getBracketStageLabel(-5, -5)).toBe("Final");
		});
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

	describe("deriveBracketState", () => {
		it("handles brackets with fewer than 2 active entrants", () => {
			const emptyState = deriveBracketState([], []);
			expect(emptyState).toEqual({
				isComplete: true,
				totalMatches: 0,
				completedMatches: 0,
				round: 1,
				totalRounds: 1,
				stageLabel: "Final",
				roundSize: 0,
				pendingMatchIds: null,
			});

			const singleState = deriveBracketState(["cat-1"], []);
			expect(singleState).toEqual({
				isComplete: true,
				totalMatches: 0,
				completedMatches: 0,
				round: 1,
				totalRounds: 1,
				stageLabel: "Final",
				roundSize: 1,
				pendingMatchIds: null,
			});

			const onlyByesState = deriveBracketState(
				["__BYE__1_0", "__BYE__1_1"],
				[],
			);
			expect(onlyByesState).toEqual({
				isComplete: true,
				totalMatches: 0,
				completedMatches: 0,
				round: 1,
				totalRounds: 1,
				stageLabel: "Final",
				roundSize: 0,
				pendingMatchIds: null,
			});
		});

		it("derives state for a 2-entrant bracket before and after completion", () => {
			const entrants = ["cat-1", "cat-2"];

			const pendingState = deriveBracketState(entrants, []);
			expect(pendingState).toEqual({
				isComplete: false,
				totalMatches: 1,
				completedMatches: 0,
				round: 1,
				totalRounds: 1,
				stageLabel: "Final",
				roundSize: 2,
				pendingMatchIds: { leftId: "cat-1", rightId: "cat-2" },
			});

			const matchRecord: MatchRecord = {
				match: { mode: "1v1", left: "cat-1", right: "cat-2" },
				winner: "cat-1",
				loser: "cat-2",
				voteType: "normal",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			};

			const completedState = deriveBracketState(entrants, [matchRecord]);
			expect(completedState).toEqual({
				isComplete: true,
				totalMatches: 1,
				completedMatches: 1,
				round: 1,
				totalRounds: 1,
				stageLabel: "Final",
				roundSize: 1,
				pendingMatchIds: null,
			});
		});

		it("progresses through a multi-round 4-entrant tournament", () => {
			const entrants = ["cat-1", "cat-2", "cat-3", "cat-4"];

			// Step 1: Initial state (Round 1, Match 1 pending: cat-1 vs cat-2)
			const state1 = deriveBracketState(entrants, []);
			expect(state1.isComplete).toBe(false);
			expect(state1.totalMatches).toBe(3);
			expect(state1.completedMatches).toBe(0);
			expect(state1.round).toBe(1);
			expect(state1.totalRounds).toBe(2);
			expect(state1.stageLabel).toBe("Semifinal");
			expect(state1.pendingMatchIds).toEqual({
				leftId: "cat-1",
				rightId: "cat-2",
			});

			const match1: MatchRecord = {
				match: { mode: "1v1", left: "cat-1", right: "cat-2" },
				winner: "cat-1",
				loser: "cat-2",
				voteType: "normal",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			};

			// Step 2: Match 1 finished (Round 1, Match 2 pending: cat-3 vs cat-4)
			const state2 = deriveBracketState(entrants, [match1]);
			expect(state2.isComplete).toBe(false);
			expect(state2.completedMatches).toBe(1);
			expect(state2.round).toBe(1);
			expect(state2.pendingMatchIds).toEqual({
				leftId: "cat-3",
				rightId: "cat-4",
			});

			const match2: MatchRecord = {
				match: { mode: "1v1", left: "cat-3", right: "cat-4" },
				winner: "cat-3",
				loser: "cat-4",
				voteType: "normal",
				matchNumber: 2,
				roundNumber: 1,
				timestamp: Date.now(),
			};

			// Step 3: Round 1 finished (Round 2 Final pending: cat-1 vs cat-3)
			const state3 = deriveBracketState(entrants, [match1, match2]);
			expect(state3.isComplete).toBe(false);
			expect(state3.completedMatches).toBe(2);
			expect(state3.round).toBe(2);
			expect(state3.stageLabel).toBe("Final");
			expect(state3.pendingMatchIds).toEqual({
				leftId: "cat-1",
				rightId: "cat-3",
			});

			const finalMatch: MatchRecord = {
				match: { mode: "1v1", left: "cat-1", right: "cat-3" },
				winner: "cat-3",
				loser: "cat-1",
				voteType: "normal",
				matchNumber: 3,
				roundNumber: 2,
				timestamp: Date.now(),
			};

			// Step 4: Final match finished (Tournament complete)
			const state4 = deriveBracketState(entrants, [match1, match2, finalMatch]);
			expect(state4.isComplete).toBe(true);
			expect(state4.completedMatches).toBe(3);
			expect(state4.round).toBe(2);
			expect(state4.stageLabel).toBe("Final");
			expect(state4.pendingMatchIds).toBeNull();
		});

		it("handles non-power-of-two entrants with automatic Byes", () => {
			const entrants = ["cat-1", "cat-2", "cat-3"];

			const initial = deriveBracketState(entrants, []);
			expect(initial.isComplete).toBe(false);
			expect(initial.totalMatches).toBe(2);
			expect(initial.totalRounds).toBe(2);
			expect(initial.pendingMatchIds).toEqual({
				leftId: "cat-1",
				rightId: "cat-2",
			});

			const match1: MatchRecord = {
				match: { mode: "1v1", left: "cat-1", right: "cat-2" },
				winner: "cat-1",
				loser: "cat-2",
				voteType: "normal",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			};

			const afterMatch1 = deriveBracketState(entrants, [match1]);
			expect(afterMatch1.isComplete).toBe(false);
			expect(afterMatch1.completedMatches).toBe(1);
			expect(afterMatch1.round).toBe(2);
			expect(afterMatch1.stageLabel).toBe("Final");
			expect(afterMatch1.pendingMatchIds).toEqual({
				leftId: "cat-1",
				rightId: "cat-3",
			});
		});

		it("handles invalid match history record with unexpected winner ID", () => {
			const entrants = ["cat-1", "cat-2"];
			const invalidRecord: MatchRecord = {
				match: { mode: "1v1", left: "cat-1", right: "cat-2" },
				winner: "unknown-cat",
				loser: "cat-2",
				voteType: "normal",
				matchNumber: 1,
				roundNumber: 1,
				timestamp: Date.now(),
			};

			const state = deriveBracketState(entrants, [invalidRecord]);
			expect(state.isComplete).toBe(false);
			expect(state.completedMatches).toBe(0);
			expect(state.pendingMatchIds).toEqual({
				leftId: "cat-1",
				rightId: "cat-2",
			});
		});

		it("caches derivation result and returns cached instance", () => {
			const entrants = ["cat-1", "cat-2"];
			const res1 = deriveBracketState(entrants, []);
			const res2 = deriveBracketState(entrants, []);

			expect(res1).toBe(res2);
		});
	});
});
