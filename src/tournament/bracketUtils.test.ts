import { describe, expect, it } from "vitest";
import type { NameItem } from "@/types";
import {
	areContendersEqual,
	buildVisualContender,
	deriveVisualBracketTree,
	isByeId,
	nextPowerOfTwo,
	padEntrantsForRound,
} from "./bracketUtils";

describe("bracketUtils", () => {
	it("identifies bye IDs correctly", () => {
		expect(isByeId("__BYE__1_2")).toBe(true);
		expect(isByeId("123")).toBe(false);
		expect(isByeId(null)).toBe(false);
		expect(isByeId(undefined)).toBe(false);
	});

	it("computes next power of two", () => {
		expect(nextPowerOfTwo(1)).toBe(1);
		expect(nextPowerOfTwo(2)).toBe(2);
		expect(nextPowerOfTwo(3)).toBe(4);
		expect(nextPowerOfTwo(5)).toBe(8);
		expect(nextPowerOfTwo(8)).toBe(8);
	});

	it("pads entrants for balanced rounds", () => {
		const padded = padEntrantsForRound(["1", "2", "3"]);
		expect(padded).toHaveLength(4);
		expect(padded[3]).toContain("__BYE__");
	});

	it("evaluates contender equality correctly", () => {
		const c1 = {
			id: "1",
			name: "Luna",
			isBye: false,
			isWinner: false,
			isLoser: false,
			rating: 1500,
			streak: 2,
			seed: 1,
		};
		const c2 = { ...c1 };
		expect(areContendersEqual(c1, c2)).toBe(true);
		expect(areContendersEqual(c1, { ...c1, isWinner: true })).toBe(false);
	});

	it("builds visual contender accurately", () => {
		const namesMap = new Map<string, NameItem>([
			["1", { id: "1", name: "Luna", rating: 1600, wins: 5, losses: 1 }],
		]);
		const teamsMap = new Map();
		const contender = buildVisualContender({
			id: "1",
			namesMap,
			teamsMap,
			ratings: { "1": 1650 },
			tournamentMode: "1v1",
		});
		expect(contender.name).toBe("Luna");
		expect(contender.rating).toBe(1650);
		expect(contender.isBye).toBe(false);
	});

	it("derives visual bracket tree accurately for single-elimination", () => {
		const mockNames: NameItem[] = [
			{ id: "1", name: "Luna", rating: 1500 },
			{ id: "2", name: "Felix", rating: 1500 },
		];

		const tree = deriveVisualBracketTree({
			bracketEntrants: ["1", "2"],
			matchHistory: [],
			names: mockNames,
			tournamentMode: "1v1",
		});

		expect(tree.totalEntrants).toBe(2);
		expect(tree.rounds).toHaveLength(1);
		expect(tree.rounds[0].matches).toHaveLength(1);
		expect(tree.rounds[0].matches[0].status).toBe("active");
	});
});
