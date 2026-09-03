import { beforeEach, describe, expect, it } from "vitest";
import {
	clearStoredTournamentSnapshot,
	readStoredTournamentSnapshot,
	writeStoredTournamentSnapshot,
} from "@/shared/lib/storage";
import type { NameItem, RatingData } from "@/shared/types";

describe("Tournament LocalStorage Persistence", () => {
	beforeEach(() => {
		clearStoredTournamentSnapshot();
	});

	it("correctly reads null when no tournament is stored", () => {
		const snapshot = readStoredTournamentSnapshot();
		expect(snapshot).toBeNull();
	});

	it("writes and reads an in-progress tournament snapshot with names, ratings, match progress, and bracket entrants", () => {
		const mockNames: NameItem[] = [
			{ id: "1", name: "Barnaby", rating: 1540 },
			{ id: "2", name: "Count Fluffington", rating: 1480 },
			{ id: "3", name: "Salem", rating: 1520 },
			{ id: "4", name: "Sir Paws-a-Lot", rating: 1460 },
		];

		const mockRatings: Record<string, RatingData> = {
			"1": { rating: 1540, wins: 1, losses: 0 },
			"2": { rating: 1480, wins: 0, losses: 1 },
		};

		writeStoredTournamentSnapshot({
			names: mockNames,
			ratings: mockRatings,
			isComplete: false,
			voteHistory: [{ winnerId: "1", loserId: "2", timestamp: 123456789 }],
			selectedNames: mockNames,
			matchHistory: [
				{
					winner: "1",
					loser: "2",
					voteType: "standard",
					matchNumber: 1,
					roundNumber: 1,
					timestamp: 123456789,
					match: {
						mode: "1v1",
						left: "1",
						right: "2",
					},
				},
			],
			currentRound: 1,
			currentMatch: 2,
			totalMatches: 3,
			bracketEntrants: ["1", "2", "3", "4"],
			lastUpdated: Date.now(),
		});

		const loaded = readStoredTournamentSnapshot();
		expect(loaded).not.toBeNull();
		expect(loaded?.names).toHaveLength(4);
		expect(loaded?.names?.[0].name).toBe("Barnaby");
		expect(loaded?.isComplete).toBe(false);
		expect(loaded?.voteHistory).toHaveLength(1);
		expect(loaded?.voteHistory[0].winnerId).toBe("1");
		expect(loaded?.matchHistory).toHaveLength(1);
		expect(loaded?.currentRound).toBe(1);
		expect(loaded?.currentMatch).toBe(2);
		expect(loaded?.totalMatches).toBe(3);
		expect(loaded?.bracketEntrants).toEqual(["1", "2", "3", "4"]);
	});

	it("clears stored tournament snapshot properly", () => {
		writeStoredTournamentSnapshot({
			names: [{ id: "1", name: "Salem" }],
			ratings: {},
			isComplete: false,
			voteHistory: [],
			selectedNames: [],
			lastUpdated: Date.now(),
		});

		expect(readStoredTournamentSnapshot()).not.toBeNull();

		clearStoredTournamentSnapshot();
		expect(readStoredTournamentSnapshot()).toBeNull();
	});
});
