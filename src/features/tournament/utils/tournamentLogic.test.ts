import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchRecord, NameItem, Team } from "@/shared/types";
import {
	calculateTournamentMetrics,
	computeUpdatedRatings,
	createIdToNameMap,
	createMatchRecord,
	createTeamsById,
	deriveBracketState,
	resolveCurrentMatch,
} from "./tournamentLogic";

describe("computeUpdatedRatings", () => {
	const ratingsSnapshot = {
		p1: 1500,
		p2: 1500,
		p3: 1200,
		p4: 1800,
	};

	it("computes updated ratings for a 1v1 match where left side wins", () => {
		const result = computeUpdatedRatings({
			currentMatch: {
				mode: "1v1",
				left: { id: "p1", name: "Player 1" },
				right: { id: "p2", name: "Player 2" },
			},
			ratingsSnapshot,
			winnerId: "p1",
			loserId: "p2",
		});
		expect(result).toEqual({ p1: 1540, p2: 1460, p3: 1200, p4: 1800 });
	});

	it("computes updated ratings for a 1v1 match where right side wins", () => {
		const result = computeUpdatedRatings({
			currentMatch: {
				mode: "1v1",
				left: { id: "p1", name: "Player 1" },
				right: { id: "p2", name: "Player 2" },
			},
			ratingsSnapshot,
			winnerId: "p2",
			loserId: "p1",
		});
		expect(result).toEqual({ p1: 1460, p2: 1540, p3: 1200, p4: 1800 });
	});

	it("computes updated ratings for a 2v2 match where left side wins", () => {
		const result = computeUpdatedRatings({
			currentMatch: {
				mode: "2v2",
				left: { id: "team1", memberIds: ["p1", "p3"], memberNames: [] },
				right: { id: "team2", memberIds: ["p2", "p4"], memberNames: [] },
			},
			ratingsSnapshot,
			winnerId: "p3", // Either p1 or p3 works, this simulates p3 making the winning play
			loserId: "p2",
		});
		expect(result).toEqual({ p1: 1568, p2: 1432, p3: 1268, p4: 1732 });
	});

	it("computes updated ratings for a 2v2 match where right side wins", () => {
		const result = computeUpdatedRatings({
			currentMatch: {
				mode: "2v2",
				left: { id: "team1", memberIds: ["p1", "p3"], memberNames: [] },
				right: { id: "team2", memberIds: ["p2", "p4"], memberNames: [] },
			},
			ratingsSnapshot,
			winnerId: "p4", // Either p2 or p4 works
			loserId: "p1",
		});
		expect(result).toEqual({ p1: 1488, p2: 1512, p3: 1188, p4: 1812 });
	});

	it("handles missing players in ratingsSnapshot using default ratings", () => {
		const result = computeUpdatedRatings({
			currentMatch: {
				mode: "1v1",
				left: { id: "newPlayer1", name: "New 1" },
				right: { id: "newPlayer2", name: "New 2" },
			},
			ratingsSnapshot, // Missing newPlayer1 and newPlayer2
			winnerId: "newPlayer1",
			loserId: "newPlayer2",
		});
		// Assuming default rating is 1000 and K-factor updates them correctly
		// The default Elo rating is 1500
		// newPlayer1 wins: 1500 + 80 * (1 - 0.5) = 1540
		// newPlayer2 loses: 1500 + 80 * (0 - 0.5) = 1460
		expect(result).toEqual({
			...ratingsSnapshot,
			newPlayer1: 1540,
			newPlayer2: 1460,
		});
	});

	it("coerces numeric IDs to strings", () => {
		const result = computeUpdatedRatings({
			currentMatch: {
				mode: "1v1",
				left: { id: 1 as unknown as string, name: "Numeric 1" },
				right: { id: 2 as unknown as string, name: "Numeric 2" },
			},
			ratingsSnapshot: {
				"1": 1500,
				"2": 1500,
			},
			winnerId: "1",
			loserId: "2",
		});
		expect(result).toEqual({ "1": 1540, "2": 1460 });
	});
});

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
		const teamA: Team = {
			id: "team1",
			memberIds: ["u1"],
			memberNames: ["User 1"],
		};
		const teamB: Team = {
			id: "team1",
			memberIds: ["u2"],
			memberNames: ["User 2"],
		};
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
			match: {
				mode: "1v1",
				left: "any",
				right: "any",
			} as unknown as MatchRecord["match"],
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

describe("calculateTournamentMetrics", () => {
	it("returns correct metrics for an ongoing tournament", () => {
		const derived = {
			isComplete: false,
			totalMatches: 10,
			completedMatches: 4,
			round: 2,
			totalRounds: 4,
			stageLabel: "Quarterfinal",
			roundSize: 8,
			pendingMatchIds: { leftId: "a", rightId: "b" },
		};

		const metrics = calculateTournamentMetrics({ derived });
		expect(metrics).toEqual({
			totalMatches: 10,
			completedMatches: 4,
			matchNumber: 5, // completedMatches + 1
			roundSize: 8,
			round: 2,
			totalRounds: 4,
			stageLabel: "Quarterfinal",
			progress: 40, // (4 / 10) * 100
			etaMinutes: 1, // Math.ceil(((10 - 4) * 3) / 60) -> 18 / 60 -> ceil(0.3) -> 1
		});
	});

	it("returns zero progress and eta for a tournament with no matches", () => {
		const derived = {
			isComplete: true,
			totalMatches: 0,
			completedMatches: 0,
			round: 1,
			totalRounds: 1,
			stageLabel: "Final",
			roundSize: 1,
			pendingMatchIds: null,
		};

		const metrics = calculateTournamentMetrics({ derived });
		expect(metrics.progress).toBe(0);
		expect(metrics.etaMinutes).toBe(0);
		expect(metrics.matchNumber).toBe(0); // isComplete is true
	});

	it("handles a completed tournament", () => {
		const derived = {
			isComplete: true,
			totalMatches: 7,
			completedMatches: 7,
			round: 3,
			totalRounds: 3,
			stageLabel: "Final",
			roundSize: 2,
			pendingMatchIds: null,
		};

		const metrics = calculateTournamentMetrics({ derived });
		expect(metrics.progress).toBe(100);
		expect(metrics.etaMinutes).toBe(0); // completedMatches >= totalMatches
		expect(metrics.matchNumber).toBe(7); // isComplete is true
	});

	it("handles completed matches exceeding total matches gracefully", () => {
		const derived = {
			isComplete: false,
			totalMatches: 5,
			completedMatches: 6,
			round: 3,
			totalRounds: 3,
			stageLabel: "Final",
			roundSize: 2,
			pendingMatchIds: { leftId: "a", rightId: "b" },
		};

		const metrics = calculateTournamentMetrics({ derived });
		// Math.min(completedMatches, totalMatches) limits progress to 100%
		expect(metrics.progress).toBe(100);
		// completedMatches >= totalMatches results in 0 eta
		expect(metrics.etaMinutes).toBe(0);
	});
});

describe("createIdToNameMap", () => {
	it("returns a map with NameItems keyed by their ID", () => {
		const names: NameItem[] = [
			{ id: "n1", name: "Name 1" },
			{ id: 2 as unknown as string, name: "Name 2" },
		];
		const result = createIdToNameMap(names);
		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(2);
		expect(result.get("n1")).toEqual(names[0]);
		expect(result.get("2")).toEqual(names[1]);
	});

	it("returns an empty map for an empty array", () => {
		const result = createIdToNameMap([]);
		expect(result).toBeInstanceOf(Map);
		expect(result.size).toBe(0);
	});
});

describe("resolveCurrentMatch", () => {
	const idToNameMap = new Map<string, NameItem>([
		["p1", { id: "p1", name: "Player 1" }],
	]);

	const teamsById = new Map<string, Team>([
		["t1", { id: "t1", memberIds: ["p1"], memberNames: ["Player 1"] }],
		["t2", { id: "t2", memberIds: ["p2"], memberNames: ["Player 2"] }],
	]);

	it("returns null if pendingMatchIds is null", () => {
		expect(
			resolveCurrentMatch({
				tournamentMode: "1v1",
				pendingMatchIds: null,
				teamsById,
				idToNameMap,
			}),
		).toBeNull();
	});

	it("returns null if mode is 2v2 and a team is missing", () => {
		expect(
			resolveCurrentMatch({
				tournamentMode: "2v2",
				pendingMatchIds: { leftId: "t1", rightId: "missing" },
				teamsById,
				idToNameMap,
			}),
		).toBeNull();
	});

	it("returns a Match object for 2v2 mode with existing teams", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "2v2",
			pendingMatchIds: { leftId: "t1", rightId: "t2" },
			teamsById,
			idToNameMap,
		});
		expect(match).toEqual({
			mode: "2v2",
			left: teamsById.get("t1"),
			right: teamsById.get("t2"),
		});
	});

	it("returns a Match object for 1v1 mode, falling back to id as name if missing", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "1v1",
			pendingMatchIds: { leftId: "p1", rightId: "missing" },
			teamsById,
			idToNameMap,
		});
		expect(match).toEqual({
			mode: "1v1",
			left: { id: "p1", name: "Player 1" },
			right: { id: "missing", name: "missing" },
		});
	});
});

describe("createMatchRecord", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("constructs a MatchRecord correctly", () => {
		const currentMatch = {
			mode: "1v1" as const,
			left: { id: "p1", name: "Player 1" },
			right: { id: "p2", name: "Player 2" },
		};

		const record = createMatchRecord({
			currentMatch,
			winnerId: "p1",
			loserId: "p2",
			matchNumber: 5,
			round: 2,
		});

		expect(record).toEqual({
			match: currentMatch,
			winner: "p1",
			loser: "p2",
			voteType: "normal",
			matchNumber: 5,
			roundNumber: 2,
			timestamp: Date.now(),
		});
	});
});
