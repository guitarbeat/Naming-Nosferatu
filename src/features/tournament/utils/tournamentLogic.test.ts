import { describe, expect, it } from "vitest";
import type { Team } from "@/shared/types";
import { createTeamsById, calculateTournamentMetrics } from "./tournamentLogic";

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


describe("calculateTournamentMetrics", () => {
	it("returns correct metrics for a newly started tournament (0 completed matches)", () => {
		const result = calculateTournamentMetrics({
			derived: {
				isComplete: false,
				totalMatches: 15,
				completedMatches: 0,
				round: 1,
				totalRounds: 4,
				stageLabel: "Round 1",
				roundSize: 16,
				pendingMatchIds: null,
			},
		});

		expect(result).toEqual({
			totalMatches: 15,
			completedMatches: 0,
			matchNumber: 1,
			roundSize: 16,
			round: 1,
			totalRounds: 4,
			stageLabel: "Round 1",
			progress: 0,
			etaMinutes: Math.ceil(15 * 3 / 60),
		});
	});

	it("returns correct metrics for an in-progress tournament", () => {
		const result = calculateTournamentMetrics({
			derived: {
				isComplete: false,
				totalMatches: 15,
				completedMatches: 7,
				round: 2,
				totalRounds: 4,
				stageLabel: "Quarterfinals",
				roundSize: 8,
				pendingMatchIds: null,
			},
		});

		expect(result).toEqual({
			totalMatches: 15,
			completedMatches: 7,
			matchNumber: 8,
			roundSize: 8,
			round: 2,
			totalRounds: 4,
			stageLabel: "Quarterfinals",
			progress: Math.round((7 / 15) * 100),
			etaMinutes: Math.ceil((15 - 7) * 3 / 60),
		});
	});

	it("returns correct metrics for a completed tournament", () => {
		const result = calculateTournamentMetrics({
			derived: {
				isComplete: true,
				totalMatches: 15,
				completedMatches: 15,
				round: 4,
				totalRounds: 4,
				stageLabel: "Finals",
				roundSize: 2,
				pendingMatchIds: null,
			},
		});

		expect(result).toEqual({
			totalMatches: 15,
			completedMatches: 15,
			matchNumber: 15, // When complete, matchNumber equals completedMatches
			roundSize: 2,
			round: 4,
			totalRounds: 4,
			stageLabel: "Finals",
			progress: 100,
			etaMinutes: 0,
		});
	});

	it("handles edge case where totalMatches is 0", () => {
		const result = calculateTournamentMetrics({
			derived: {
				isComplete: false,
				totalMatches: 0,
				completedMatches: 0,
				round: 1,
				totalRounds: 1,
				stageLabel: "Round 1",
				roundSize: 0,
				pendingMatchIds: null,
			},
		});

		expect(result).toEqual({
			totalMatches: 0,
			completedMatches: 0,
			matchNumber: 1,
			roundSize: 0,
			round: 1,
			totalRounds: 1,
			stageLabel: "Round 1",
			progress: 0,
			etaMinutes: 0,
		});
	});

	it("handles edge case where completedMatches exceeds totalMatches", () => {
		const result = calculateTournamentMetrics({
			derived: {
				isComplete: true,
				totalMatches: 10,
				completedMatches: 12, // Should cap at totalMatches for progress
				round: 3,
				totalRounds: 3,
				stageLabel: "Finals",
				roundSize: 2,
				pendingMatchIds: null,
			},
		});

		expect(result).toEqual({
			totalMatches: 10,
			completedMatches: 12,
			matchNumber: 12,
			roundSize: 2,
			round: 3,
			totalRounds: 3,
			stageLabel: "Finals",
			progress: 100, // min(12, 10) / 10 = 100%
			etaMinutes: 0, // completed >= total matches
		});
	});
});
