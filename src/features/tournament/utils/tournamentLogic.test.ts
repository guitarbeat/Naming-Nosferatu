import { describe, expect, it } from "vitest";
import type { NameItem, Team } from "@/shared/types";
import { createTeamsById, resolveCurrentMatch } from "./tournamentLogic";

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

describe("resolveCurrentMatch", () => {
	const mockTeamsById = new Map<string, Team>([
		["team1", { id: "team1", memberIds: ["user1"], memberNames: ["User 1"] }],
		["team2", { id: "team2", memberIds: ["user2"], memberNames: ["User 2"] }],
	]);

	const mockIdToNameMap = new Map<string, NameItem>([
		["name1", { id: "name1", name: "Fluffy" } as NameItem],
		["name2", { id: "name2", name: "Mittens" } as NameItem],
	]);

	it("returns null if pendingMatchIds is null", () => {
		expect(
			resolveCurrentMatch({
				tournamentMode: "1v1",
				pendingMatchIds: null,
				teamsById: mockTeamsById,
				idToNameMap: mockIdToNameMap,
			}),
		).toBeNull();
	});

	it("resolves 1v1 match correctly when names exist in map", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "1v1",
			pendingMatchIds: { leftId: "name1", rightId: "name2" },
			teamsById: mockTeamsById,
			idToNameMap: mockIdToNameMap,
		});

		expect(match).toEqual({
			mode: "1v1",
			left: { id: "name1", name: "Fluffy" },
			right: { id: "name2", name: "Mittens" },
		});
	});

	it("resolves 1v1 match with fallback objects when names do not exist in map", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "1v1",
			pendingMatchIds: { leftId: "unknown1", rightId: "unknown2" },
			teamsById: mockTeamsById,
			idToNameMap: mockIdToNameMap,
		});

		expect(match).toEqual({
			mode: "1v1",
			left: { id: "unknown1", name: "unknown1" },
			right: { id: "unknown2", name: "unknown2" },
		});
	});

	it("resolves 2v2 match correctly when teams exist in map", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "2v2",
			pendingMatchIds: { leftId: "team1", rightId: "team2" },
			teamsById: mockTeamsById,
			idToNameMap: mockIdToNameMap,
		});

		expect(match).toEqual({
			mode: "2v2",
			left: { id: "team1", memberIds: ["user1"], memberNames: ["User 1"] },
			right: { id: "team2", memberIds: ["user2"], memberNames: ["User 2"] },
		});
	});

	it("returns null for 2v2 mode when left team does not exist", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "2v2",
			pendingMatchIds: { leftId: "unknown", rightId: "team2" },
			teamsById: mockTeamsById,
			idToNameMap: mockIdToNameMap,
		});

		expect(match).toBeNull();
	});

	it("returns null for 2v2 mode when right team does not exist", () => {
		const match = resolveCurrentMatch({
			tournamentMode: "2v2",
			pendingMatchIds: { leftId: "team1", rightId: "unknown" },
			teamsById: mockTeamsById,
			idToNameMap: mockIdToNameMap,
		});

		expect(match).toBeNull();
	});
});
