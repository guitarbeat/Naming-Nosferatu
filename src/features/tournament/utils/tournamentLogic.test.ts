import { describe, expect, it } from "vitest";
import type { Team } from "@/shared/types";
import { createTeamsById } from "./tournamentLogic";

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
