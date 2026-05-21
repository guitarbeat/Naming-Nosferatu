import { describe, expect, it } from "vitest";
import type { MatchRecord, Team } from "@/shared/types";
import { createTeamsById, deriveBracketState } from "./tournamentLogic";

describe("createTeamsById", () => {
	it("returns an empty map when given an empty array", () => {
		const result = createTeamsById([]);
		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(0);
	});

	it("returns a map with teams keyed by their ID", () => {
		const teams: Team[] = [
			{ id: "team1", memberIds: ["u1"], memberNames: ["User 1"] },
			{ id: "team2", memberIds: ["u2"], memberNames: ["User 2"] },
		];
		const result = createTeamsById(teams);
		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(2);
		expect(result.get("team1")).toEqual(teams[0]);
		expect(result.get("team2")).toEqual(teams[1]);
	});

	it("overrides earlier teams if duplicate IDs exist", () => {
		const teamA: Team = { id: "team1", memberIds: ["u1"], memberNames: ["User 1"] };
		const teamB: Team = { id: "team1", memberIds: ["u2"], memberNames: ["User 2"] };
		const teams: Team[] = [teamA, teamB];

		const result = createTeamsById(teams);
		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(1);
		expect(result.get("team1")).toEqual(teamB);
	});
});

describe("deriveBracketState", () => {
	function mockRecord(winner: string): MatchRecord {
		return {
			match: { mode: "1v1", left: "any", right: "any" } as any,
			winner,
			loser: "any",
			voteType: "manual",
			matchNumber: 1,
			roundNumber: 1,
			timestamp: Date.now(),
		};
	}

	it("returns a completed state for 1 entrant", () => {
		const result = deriveBracketState(["a"], []);
		expect(result).toEqual({
			isComplete: true,
			totalMatches: 0,
			completedMatches: 0,
			round: 1,
			totalRounds: 1,
			stageLabel: "Final",
			roundSize: 1,
			pendingMatchIds: null,
		});
	});

	it("returns an initial state for 4 entrants with no history", () => {
		const result = deriveBracketState(["a", "b", "c", "d"], []);
		expect(result).toEqual({
			isComplete: false,
			totalMatches: 3,
			completedMatches: 0,
			round: 1,
			totalRounds: 2,
			stageLabel: "Semifinal",
			roundSize: 4,
			pendingMatchIds: { leftId: "a", rightId: "b" },
		});
	});

	it("returns a pending state when history has fewer records than total matches", () => {
		const result = deriveBracketState(["a", "b", "c", "d"], [mockRecord("a")]);
		expect(result).toEqual({
			isComplete: false,
			totalMatches: 3,
			completedMatches: 1,
			round: 1,
			totalRounds: 2,
			stageLabel: "Semifinal",
			roundSize: 4,
			pendingMatchIds: { leftId: "c", rightId: "d" },
		});
	});

	it("returns a completed state when history covers all matches", () => {
		const result = deriveBracketState(
			["a", "b", "c", "d"],
			[mockRecord("a"), mockRecord("c"), mockRecord("a")],
		);
		expect(result.isComplete).toBe(true);
		expect(result.completedMatches).toBe(3);
		expect(result.pendingMatchIds).toBeNull();
	});

	it("handles corrupted history by returning a pending match", () => {
		// First match a vs b, history says 'x' won which doesn't match either side
		const result = deriveBracketState(["a", "b", "c", "d"], [mockRecord("x")]);
		expect(result.isComplete).toBe(false);
		expect(result.completedMatches).toBe(0); // Ignores the corrupted record
		expect(result.pendingMatchIds).toEqual({ leftId: "a", rightId: "b" });
	});

	it("handles non-power-of-two entrants using byes", () => {
		const result = deriveBracketState(["a", "b", "c"], []);
		expect(result).toEqual({
			isComplete: false,
			totalMatches: 2,
			completedMatches: 0,
			round: 1,
			totalRounds: 2,
			stageLabel: "Semifinal",
			roundSize: 3,
			pendingMatchIds: { leftId: "a", rightId: "b" },
		});

		// Match 1: a vs b, winner a
		const step2 = deriveBracketState(["a", "b", "c"], [mockRecord("a")]);
		expect(step2).toEqual({
			isComplete: false,
			totalMatches: 2,
			completedMatches: 1,
			round: 2,
			totalRounds: 2,
			stageLabel: "Final",
			roundSize: 2,
			pendingMatchIds: { leftId: "a", rightId: "c" },
		});
	});

	it("caches results for the same inputs", () => {
		const entrants = ["a", "b", "c", "d"];
		const result1 = deriveBracketState(entrants, []);
		const result2 = deriveBracketState(entrants, []);
		expect(result1).toBe(result2); // Exact same object reference

		const history = [mockRecord("b")];
		const result3 = deriveBracketState(entrants, history);
		const result4 = deriveBracketState(entrants, history);
		expect(result3).toBe(result4);
		expect(result3).not.toBe(result1);
	});
});
