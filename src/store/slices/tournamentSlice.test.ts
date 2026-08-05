import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import type { AppState } from "@/store/appStore.types";
import { createTournamentSlice } from "./tournamentSlice";

describe("tournamentSlice", () => {
	let useStore: ReturnType<typeof create<Pick<AppState, "tournament" | "tournamentActions">>>;

	beforeEach(() => {
		useStore = create<Pick<AppState, "tournament" | "tournamentActions">>((...args) => ({
			...createTournamentSlice(...args),
		}));
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("initial state", () => {
		it("should have correct initial state", () => {
			const state = useStore.getState().tournament;
			expect(state).toEqual({
				names: null,
				ratings: {},
				isComplete: false,
				isLoading: false,
				voteHistory: [],
				selectedNames: [],
			});
		});
	});

	describe("setNames", () => {
		it("should set names and default ratings to 1500 if not present", () => {
			const names = [
				{ id: "1", name: "Name 1", description: "Desc 1" },
				{ id: "2", name: "Name 2" },
			];

			useStore.getState().tournamentActions.setNames(names);

			const state = useStore.getState().tournament;
			expect(state.names).toEqual([
				{ id: "1", name: "Name 1", description: "Desc 1", rating: 1500 },
				{ id: "2", name: "Name 2", description: undefined, rating: 1500 },
			]);
		});

		it("should preserve existing ratings when setting names", () => {
			// First set a rating for "Name 1"
			useStore.getState().tournamentActions.setRatings({
				"Name 1": { rating: 1600, wins: 1, losses: 0, matches: 1, eloRating: 1600 },
			});

			const names = [
				{ id: "1", name: "Name 1" },
				{ id: "2", name: "Name 2" },
			];

			useStore.getState().tournamentActions.setNames(names);

			const state = useStore.getState().tournament;
			expect(state.names).toEqual([
				{ id: "1", name: "Name 1", description: undefined, rating: 1600 },
				{ id: "2", name: "Name 2", description: undefined, rating: 1500 },
			]);
		});

		it("should set names to null if null is provided", () => {
			useStore.getState().tournamentActions.setNames([{ id: "1", name: "Test" }]);
			expect(useStore.getState().tournament.names).not.toBeNull();

			useStore.getState().tournamentActions.setNames(null);
			expect(useStore.getState().tournament.names).toBeNull();
		});
	});

	describe("setRatings", () => {
		it("should merge ratings when an object is provided", () => {
			useStore.getState().tournamentActions.setRatings({
				"Name 1": { rating: 1600, wins: 1, losses: 0, matches: 1, eloRating: 1600 },
			});
			useStore.getState().tournamentActions.setRatings({
				"Name 2": { rating: 1400, wins: 0, losses: 1, matches: 1, eloRating: 1400 },
			});

			const state = useStore.getState().tournament;
			expect(state.ratings).toEqual({
				"Name 1": { rating: 1600, wins: 1, losses: 0, matches: 1, eloRating: 1600 },
				"Name 2": { rating: 1400, wins: 0, losses: 1, matches: 1, eloRating: 1400 },
			});
		});

		it("should update ratings when a function is provided", () => {
			useStore.getState().tournamentActions.setRatings({
				"Name 1": { rating: 1500, wins: 0, losses: 0, matches: 0, eloRating: 1500 },
			});

			useStore.getState().tournamentActions.setRatings((prev) => ({
				"Name 1": { ...prev["Name 1"], rating: 1600 },
			}));

			const state = useStore.getState().tournament;
			expect(state.ratings["Name 1"].rating).toBe(1600);
		});
	});

	describe("setComplete", () => {
		it("should set isComplete to the provided value", () => {
			useStore.getState().tournamentActions.setComplete(true);
			expect(useStore.getState().tournament.isComplete).toBe(true);

			useStore.getState().tournamentActions.setComplete(false);
			expect(useStore.getState().tournament.isComplete).toBe(false);
		});
	});

	describe("completeTournament", () => {
		it("should merge ratings and set isComplete to true", () => {
			useStore.getState().tournamentActions.setRatings({
				"Name 1": { rating: 1500, wins: 0, losses: 0, matches: 0, eloRating: 1500 },
			});

			useStore.getState().tournamentActions.completeTournament({
				"Name 2": { rating: 1600, wins: 1, losses: 0, matches: 1, eloRating: 1600 },
			});

			const state = useStore.getState().tournament;
			expect(state.isComplete).toBe(true);
			expect(state.ratings).toEqual({
				"Name 1": { rating: 1500, wins: 0, losses: 0, matches: 0, eloRating: 1500 },
				"Name 2": { rating: 1600, wins: 1, losses: 0, matches: 1, eloRating: 1600 },
			});
		});
	});

	describe("resetTournament", () => {
		it("should reset tournament names, isComplete, and voteHistory", () => {
			// Set initial state to non-default values
			useStore.getState().tournamentActions.setNames([{ id: "1", name: "Name 1" }]);
			useStore.getState().tournamentActions.setComplete(true);
			useStore.getState().tournamentActions.recordVote("winner", "loser");
			useStore.getState().tournamentActions.setSelection([{ id: "1", name: "Name 1" }]);
			useStore.getState().tournamentActions.setRatings({
				"Name 1": { rating: 1600, wins: 1, losses: 0, matches: 1, eloRating: 1600 },
			});

			// Perform reset
			useStore.getState().tournamentActions.resetTournament();

			const state = useStore.getState().tournament;
			expect(state.names).toBeNull();
			expect(state.isComplete).toBe(false);
			expect(state.voteHistory).toEqual([]);

			// Ratings and selection shouldn't be touched by resetTournament as per the source code
			expect(state.ratings).not.toEqual({});
			expect(state.selectedNames).not.toEqual([]);
		});
	});

	describe("setSelection", () => {
		it("should update selectedNames", () => {
			const selection = [{ id: "1", name: "Selected" }];
			useStore.getState().tournamentActions.setSelection(selection);

			expect(useStore.getState().tournament.selectedNames).toEqual(selection);
		});
	});

	describe("recordVote", () => {
		it("should append vote to voteHistory with timestamp", () => {
			useStore.getState().tournamentActions.recordVote("win1", "lose1");

			// Advance time for second vote
			vi.setSystemTime(new Date("2023-01-01T00:01:00Z"));
			useStore.getState().tournamentActions.recordVote("win2", "lose2");

			const state = useStore.getState().tournament;
			expect(state.voteHistory).toHaveLength(2);
			expect(state.voteHistory[0]).toEqual({
				winnerId: "win1",
				loserId: "lose1",
				timestamp: new Date("2023-01-01T00:00:00Z").getTime(),
			});
			expect(state.voteHistory[1]).toEqual({
				winnerId: "win2",
				loserId: "lose2",
				timestamp: new Date("2023-01-01T00:01:00Z").getTime(),
			});
		});

		it("should include memberIds if provided", () => {
			useStore.getState().tournamentActions.recordVote("win1", "lose1", ["member1"], ["member2", "member3"]);

			const state = useStore.getState().tournament;
			expect(state.voteHistory).toHaveLength(1);
			expect(state.voteHistory[0]).toEqual({
				winnerId: "win1",
				loserId: "lose1",
				timestamp: new Date("2023-01-01T00:00:00Z").getTime(),
				winnerMemberIds: ["member1"],
				loserMemberIds: ["member2", "member3"],
			});
		});
	});

	describe("clearVoteHistory", () => {
		it("should clear voteHistory", () => {
			useStore.getState().tournamentActions.recordVote("win1", "lose1");
			expect(useStore.getState().tournament.voteHistory).toHaveLength(1);

			useStore.getState().tournamentActions.clearVoteHistory();
			expect(useStore.getState().tournament.voteHistory).toHaveLength(0);
		});
	});
});
