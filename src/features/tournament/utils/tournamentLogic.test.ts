import { describe, expect, it } from "vitest";
import type { Team } from "@/shared/types";
import { createTeamsById, padForRound } from "./tournamentLogic";

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

describe("padForRound", () => {
	it("returns the same array if it has 0 or 1 elements", () => {
		expect(padForRound([], 1)).toEqual([]);
		expect(padForRound(["a"], 1)).toEqual(["a"]);
	});

	it("returns the same array if its length is already a power of two", () => {
		expect(padForRound(["a", "b"], 1)).toEqual(["a", "b"]);
		expect(padForRound(["a", "b", "c", "d"], 1)).toEqual(["a", "b", "c", "d"]);
	});

	it("pads an array of 3 elements to 4 using BYE strings", () => {
		const result = padForRound(["a", "b", "c"], 1);
		expect(result.length).toBe(4);
		expect(result).toEqual(["a", "b", "c", "__BYE__1_3"]);
	});

	it("pads an array of 5 elements to 8 using BYE strings with the correct round and index", () => {
		const result = padForRound(["a", "b", "c", "d", "e"], 2);
		expect(result.length).toBe(8);
		expect(result).toEqual([
			"a", "b", "c", "d", "e",
			"__BYE__2_5", "__BYE__2_6", "__BYE__2_7"
		]);
	});
});
