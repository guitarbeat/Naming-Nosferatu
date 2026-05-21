import { describe, it, expect } from "vitest";
import { extractMatchData, getMatchSideId, getMatchSideName } from "./matchHelpers";
import type { Match, HeadToHeadMatch, TeamVersusMatch } from "@/shared/types";

describe("matchHelpers", () => {
	describe("extractMatchData", () => {
		it("extracts data from a 2v2 match", () => {
			const match: TeamVersusMatch = {
				mode: "2v2",
				left: {
					id: "team-1",
					memberIds: ["p1", "p2"],
					memberNames: ["Player One", "Player Two"],
				},
				right: {
					id: "team-2",
					memberIds: ["p3", "p4"],
					memberNames: ["Player Three", "Player Four"],
				},
			};

			const result = extractMatchData(match);

			expect(result).toEqual({
				leftId: "team-1",
				rightId: "team-2",
				leftName: "Player One + Player Two",
				rightName: "Player Three + Player Four",
				leftMembers: ["Player One", "Player Two"],
				rightMembers: ["Player Three", "Player Four"],
				leftIsTeam: true,
				rightIsTeam: true,
			});
		});

		it("extracts data from a 1v1 match with NameItem objects", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: {
					id: "item-1",
					name: "Name One",
					description: "First description",
					pronunciation: "pro-NUN-see-a-shun 1",
				},
				right: {
					id: "item-2",
					name: "Name Two",
					description: "Second description",
				},
			};

			const result = extractMatchData(match);

			expect(result).toEqual({
				leftId: "item-1",
				rightId: "item-2",
				leftName: "Name One",
				rightName: "Name Two",
				leftMembers: ["Name One"],
				rightMembers: ["Name Two"],
				leftIsTeam: false,
				rightIsTeam: false,
				leftDescription: "First description",
				rightDescription: "Second description",
				leftPronunciation: "pro-NUN-see-a-shun 1",
				rightPronunciation: undefined,
			});
		});

		it("extracts data from a 1v1 match with string participants", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "String One",
				right: "String Two",
			};

			const result = extractMatchData(match);

			expect(result).toEqual({
				leftId: "String One",
				rightId: "String Two",
				leftName: "String One",
				rightName: "String Two",
				leftMembers: ["String One"],
				rightMembers: ["String Two"],
				leftIsTeam: false,
				rightIsTeam: false,
				leftDescription: undefined,
				rightDescription: undefined,
				leftPronunciation: undefined,
				rightPronunciation: undefined,
			});
		});
	});

	describe("getMatchSideId", () => {
		it("returns id from NameItem participant", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: { id: "left-id", name: "Left Name" },
				right: { id: "right-id", name: "Right Name" },
			};
			expect(getMatchSideId(match, "left")).toBe("left-id");
			expect(getMatchSideId(match, "right")).toBe("right-id");
		});

		it("returns string value from string participant", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "left-string",
				right: "right-string",
			};
			expect(getMatchSideId(match, "left")).toBe("left-string");
			expect(getMatchSideId(match, "right")).toBe("right-string");
		});
	});

	describe("getMatchSideName", () => {
		it("returns joined member names for 2v2 mode", () => {
			const match: TeamVersusMatch = {
				mode: "2v2",
				left: { id: "t1", memberIds: [], memberNames: ["A", "B"] },
				right: { id: "t2", memberIds: [], memberNames: ["C", "D"] },
			};
			expect(getMatchSideName(match, "left")).toBe("A + B");
			expect(getMatchSideName(match, "right")).toBe("C + D");
		});

		it("returns name from NameItem participant", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: { id: "1", name: "Left Name" },
				right: { id: "2", name: "Right Name" },
			};
			expect(getMatchSideName(match, "left")).toBe("Left Name");
			expect(getMatchSideName(match, "right")).toBe("Right Name");
		});

		it("returns string value from string participant", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "Left String",
				right: "Right String",
			};
			expect(getMatchSideName(match, "left")).toBe("Left String");
			expect(getMatchSideName(match, "right")).toBe("Right String");
		});
	});
});
