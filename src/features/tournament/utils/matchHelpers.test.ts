import { describe, expect, it } from "vitest";
import type {
	HeadToHeadMatch,
	NameItem,
	Team,
	TeamVersusMatch,
} from "@/shared/types";
import {
	extractMatchData,
	getMatchSideId,
	getMatchSideName,
} from "./matchHelpers";

describe("matchHelpers", () => {
	describe("getMatchSideId", () => {
		it("returns string ID when participant is a NameItem object (1v1)", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: { id: "123", name: "LeftCat" } as NameItem,
				right: { id: "456", name: "RightCat" } as NameItem,
			};
			expect(getMatchSideId(match, "left")).toBe("123");
			expect(getMatchSideId(match, "right")).toBe("456");
		});

		it("returns string ID when participant id is a number (1v1)", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: { id: 789, name: "LeftCat" } as NameItem,
				right: { id: 101, name: "RightCat" } as NameItem,
			};
			expect(getMatchSideId(match, "left")).toBe("789");
			expect(getMatchSideId(match, "right")).toBe("101");
		});

		it("returns the participant string when participant is a string (1v1)", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "left-id-string",
				right: "right-id-string",
			};
			expect(getMatchSideId(match, "left")).toBe("left-id-string");
			expect(getMatchSideId(match, "right")).toBe("right-id-string");
		});

		it("returns the team ID when participant is a Team object (2v2)", () => {
			const leftTeam: Team = {
				id: "team-a",
				memberIds: ["1", "2"],
				memberNames: ["Cat1", "Cat2"],
			};
			const rightTeam: Team = {
				id: "team-b",
				memberIds: ["3", "4"],
				memberNames: ["Cat3", "Cat4"],
			};
			const match: TeamVersusMatch = {
				mode: "2v2",
				left: leftTeam,
				right: rightTeam,
			};
			expect(getMatchSideId(match, "left")).toBe("team-a");
			expect(getMatchSideId(match, "right")).toBe("team-b");
		});

		it("handles numeric strings correctly", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "123",
				right: "456",
			};
			expect(getMatchSideId(match, "left")).toBe("123");
		});
	});

	describe("getMatchSideName", () => {
		it("returns joined member names for 2v2 matches", () => {
			const leftTeam: Team = {
				id: "team-a",
				memberIds: ["1", "2"],
				memberNames: ["Cat1", "Cat2"],
			};
			const rightTeam: Team = {
				id: "team-b",
				memberIds: ["3", "4"],
				memberNames: ["Cat3", "Cat4"],
			};
			const match: TeamVersusMatch = {
				mode: "2v2",
				left: leftTeam,
				right: rightTeam,
			};
			expect(getMatchSideName(match, "left")).toBe("Cat1 + Cat2");
			expect(getMatchSideName(match, "right")).toBe("Cat3 + Cat4");
		});

		it("returns participant name for 1v1 match when participant is an object", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: { id: "123", name: "LeftCat" } as NameItem,
				right: { id: "456", name: "RightCat" } as NameItem,
			};
			expect(getMatchSideName(match, "left")).toBe("LeftCat");
			expect(getMatchSideName(match, "right")).toBe("RightCat");
		});

		it("returns participant string for 1v1 match when participant is a string", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "string-cat-1",
				right: "string-cat-2",
			};
			expect(getMatchSideName(match, "left")).toBe("string-cat-1");
			expect(getMatchSideName(match, "right")).toBe("string-cat-2");
		});
	});

	describe("extractMatchData", () => {
		it("extracts data correctly for 2v2 matches", () => {
			const leftTeam: Team = {
				id: "team-a",
				memberIds: ["1", "2"],
				memberNames: ["Cat1", "Cat2"],
			};
			const rightTeam: Team = {
				id: "team-b",
				memberIds: ["3", "4"],
				memberNames: ["Cat3", "Cat4"],
			};
			const match: TeamVersusMatch = {
				mode: "2v2",
				left: leftTeam,
				right: rightTeam,
			};

			const data = extractMatchData(match);

			expect(data).toEqual({
				leftId: "team-a",
				rightId: "team-b",
				leftName: "Cat1 + Cat2",
				rightName: "Cat3 + Cat4",
				leftMembers: ["Cat1", "Cat2"],
				rightMembers: ["Cat3", "Cat4"],
				leftIsTeam: true,
				rightIsTeam: true,
			});
		});

		it("extracts data correctly for 1v1 matches with NameItem objects", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: {
					id: "123",
					name: "LeftCat",
					description: "Left description",
					pronunciation: "Left pro",
				} as NameItem,
				right: { id: 456, name: "RightCat" } as NameItem,
			};

			const data = extractMatchData(match);

			expect(data).toEqual({
				leftId: "123",
				rightId: "456",
				leftName: "LeftCat",
				rightName: "RightCat",
				leftMembers: ["LeftCat"],
				rightMembers: ["RightCat"],
				leftIsTeam: false,
				rightIsTeam: false,
				leftDescription: "Left description",
				rightDescription: undefined,
				leftPronunciation: "Left pro",
				rightPronunciation: undefined,
			});
		});

		it("extracts data correctly for 1v1 matches with string participants", () => {
			const match: HeadToHeadMatch = {
				mode: "1v1",
				left: "string-cat-1",
				right: "string-cat-2",
			};

			const data = extractMatchData(match);

			expect(data).toEqual({
				leftId: "string-cat-1",
				rightId: "string-cat-2",
				leftName: "string-cat-1",
				rightName: "string-cat-2",
				leftMembers: ["string-cat-1"],
				rightMembers: ["string-cat-2"],
				leftIsTeam: false,
				rightIsTeam: false,
				leftDescription: undefined,
				rightDescription: undefined,
				leftPronunciation: undefined,
				rightPronunciation: undefined,
			});
		});
	});
});
