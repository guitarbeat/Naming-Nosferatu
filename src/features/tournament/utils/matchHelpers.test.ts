import { describe, it, expect } from "vitest";
import { getMatchSideId } from "./matchHelpers";
import type { Match, NameItem, Team } from "@/shared/types";

describe("getMatchSideId", () => {
	it("returns the string representation when participant is a string (1v1)", () => {
		const match: Match = {
			mode: "1v1",
			left: "id-left-123",
			right: "id-right-456",
		};

		expect(getMatchSideId(match, "left")).toBe("id-left-123");
		expect(getMatchSideId(match, "right")).toBe("id-right-456");
	});

	it("returns the stringified ID when participant is a NameItem object (1v1)", () => {
		const leftItem: NameItem = {
			id: 1,
			name: "Alice",
		};
		const rightItem: NameItem = {
			id: 2,
			name: "Bob",
		};
		const match: Match = {
			mode: "1v1",
			left: leftItem,
			right: rightItem,
		};

		expect(getMatchSideId(match, "left")).toBe("1");
		expect(getMatchSideId(match, "right")).toBe("2");
	});

	it("returns the stringified ID when participant is a Team object (2v2)", () => {
		const leftTeam: Team = {
			id: "team-1",
			memberIds: ["1", "2"],
			memberNames: ["Alice", "Bob"],
		};
		const rightTeam: Team = {
			id: "team-2",
			memberIds: ["3", "4"],
			memberNames: ["Charlie", "Dave"],
		};
		const match: Match = {
			mode: "2v2",
			left: leftTeam,
			right: rightTeam,
		};

		expect(getMatchSideId(match, "left")).toBe("team-1");
		expect(getMatchSideId(match, "right")).toBe("team-2");
	});

	it("handles numeric primitive IDs properly", () => {
		const match = {
			mode: "1v1",
			left: 123,
			right: 456,
		} as unknown as Match;

		expect(getMatchSideId(match, "left")).toBe("123");
		expect(getMatchSideId(match, "right")).toBe("456");
	});
});
