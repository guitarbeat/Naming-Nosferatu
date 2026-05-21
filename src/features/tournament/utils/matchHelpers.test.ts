import { describe, expect, it } from "vitest";
import type { Match, NameItem, Team } from "@/shared/types";
import { extractMatchData, getMatchSideId, getMatchSideName } from "./matchHelpers";

describe("matchHelpers", () => {
	const mockName1: NameItem = {
		id: "n1",
		name: "Fluffy",
		description: "A very fluffy cat",
		pronunciation: "Fluf-fee",
	};

	const mockName2: NameItem = {
		id: "n2",
		name: "Mittens",
		description: "Has white paws",
	};

	const mockTeam1: Team = {
		id: "t1",
		memberIds: ["n1", "n2"],
		memberNames: ["Fluffy", "Mittens"],
	};

	const mockTeam2: Team = {
		id: "t2",
		memberIds: ["n3", "n4"],
		memberNames: ["Garfield", "Odie"],
	};

	const match1v1Objects: Match = {
		mode: "1v1",
		left: mockName1,
		right: mockName2,
	};

	const match1v1Strings: Match = {
		mode: "1v1",
		left: "id1",
		right: "id2",
	};

	const match2v2: Match = {
		mode: "2v2",
		left: mockTeam1,
		right: mockTeam2,
	};

	describe("getMatchSideId", () => {
		it("extracts id from an object participant", () => {
			expect(getMatchSideId(match1v1Objects, "left")).toBe("n1");
			expect(getMatchSideId(match1v1Objects, "right")).toBe("n2");
		});

		it("returns the string representation if participant is a string", () => {
			expect(getMatchSideId(match1v1Strings, "left")).toBe("id1");
			expect(getMatchSideId(match1v1Strings, "right")).toBe("id2");
		});

		it("extracts id from a team participant in 2v2", () => {
			// team objects are objects too
			expect(getMatchSideId(match2v2, "left")).toBe("t1");
			expect(getMatchSideId(match2v2, "right")).toBe("t2");
		});
	});

	describe("getMatchSideName", () => {
		it("returns the name property for an object participant in 1v1", () => {
			expect(getMatchSideName(match1v1Objects, "left")).toBe("Fluffy");
			expect(getMatchSideName(match1v1Objects, "right")).toBe("Mittens");
		});

		it("returns the string itself for a string participant in 1v1", () => {
			expect(getMatchSideName(match1v1Strings, "left")).toBe("id1");
			expect(getMatchSideName(match1v1Strings, "right")).toBe("id2");
		});

		it("joins member names with '+' for team participants in 2v2", () => {
			expect(getMatchSideName(match2v2, "left")).toBe("Fluffy + Mittens");
			expect(getMatchSideName(match2v2, "right")).toBe("Garfield + Odie");
		});
	});

	describe("extractMatchData", () => {
		it("extracts match data properly for 1v1 with object participants", () => {
			const data = extractMatchData(match1v1Objects);
			expect(data).toEqual({
				leftId: "n1",
				rightId: "n2",
				leftName: "Fluffy",
				rightName: "Mittens",
				leftMembers: ["Fluffy"],
				rightMembers: ["Mittens"],
				leftIsTeam: false,
				rightIsTeam: false,
				leftDescription: "A very fluffy cat",
				rightDescription: "Has white paws",
				leftPronunciation: "Fluf-fee",
				rightPronunciation: undefined,
			});
		});

		it("extracts match data properly for 1v1 with string participants", () => {
			const data = extractMatchData(match1v1Strings);
			expect(data).toEqual({
				leftId: "id1",
				rightId: "id2",
				leftName: "id1",
				rightName: "id2",
				leftMembers: ["id1"],
				rightMembers: ["id2"],
				leftIsTeam: false,
				rightIsTeam: false,
				leftDescription: undefined,
				rightDescription: undefined,
				leftPronunciation: undefined,
				rightPronunciation: undefined,
			});
		});

		it("extracts match data properly for 2v2", () => {
			const data = extractMatchData(match2v2);
			expect(data).toEqual({
				leftId: "t1",
				rightId: "t2",
				leftName: "Fluffy + Mittens",
				rightName: "Garfield + Odie",
				leftMembers: ["Fluffy", "Mittens"],
				rightMembers: ["Garfield", "Odie"],
				leftIsTeam: true,
				rightIsTeam: true,
			});
		});
	});
});
