import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import type { AppState } from "@/store/appStore.types";
import { createTournamentSlice } from "./tournamentSlice";
import type { NameItem } from "@/shared/types";

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
		vi.useRealTimers();
	});

	describe("setNames", () => {
		it("should set names and initialize ratings to 1500 if not present", () => {
			const names: NameItem[] = [
				{ id: "1", name: "Alice", description: "First" },
				{ id: "2", name: "Bob", description: "Second" },
			];

			useStore.getState().tournamentActions.setNames(names);

			const state = useStore.getState();
			expect(state.tournament.names).toEqual([
				{ id: "1", name: "Alice", description: "First", rating: 1500 },
				{ id: "2", name: "Bob", description: "Second", rating: 1500 },
			]);
		});

		it("should set names and preserve existing ratings", () => {
			useStore.getState().tournamentActions.setRatings({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
			});

			const names: NameItem[] = [
				{ id: "1", name: "Alice", description: "First" },
				{ id: "2", name: "Bob", description: "Second" },
			];

			useStore.getState().tournamentActions.setNames(names);

			const state = useStore.getState();
			expect(state.tournament.names).toEqual([
				{ id: "1", name: "Alice", description: "First", rating: 1600 },
				{ id: "2", name: "Bob", description: "Second", rating: 1500 },
			]);
		});

		it("should handle null names", () => {
			useStore.getState().tournamentActions.setNames(null);
			const state = useStore.getState();
			expect(state.tournament.names).toBeNull();
		});
	});

	describe("setRatings", () => {
		it("should update ratings using an object", () => {
			useStore.getState().tournamentActions.setRatings({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
			});

			const state = useStore.getState();
			expect(state.tournament.ratings).toEqual({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
			});
		});

		it("should update ratings using a function", () => {
			useStore.getState().tournamentActions.setRatings({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
			});

			useStore.getState().tournamentActions.setRatings((prev) => ({
				...prev,
				Bob: { rating: 1550, wins: 1, losses: 0, matches: 1 },
			}));

			const state = useStore.getState();
			expect(state.tournament.ratings).toEqual({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
				Bob: { rating: 1550, wins: 1, losses: 0, matches: 1 },
			});
		});
	});

	describe("setComplete", () => {
		it("should update isComplete flag", () => {
			useStore.getState().tournamentActions.setComplete(true);
			expect(useStore.getState().tournament.isComplete).toBe(true);

			useStore.getState().tournamentActions.setComplete(false);
			expect(useStore.getState().tournament.isComplete).toBe(false);
		});
	});

	describe("completeTournament", () => {
		it("should update ratings and set isComplete to true", () => {
			useStore.getState().tournamentActions.completeTournament({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
			});

			const state = useStore.getState();
			expect(state.tournament.ratings).toEqual({
				Alice: { rating: 1600, wins: 1, losses: 0, matches: 1 },
			});
			expect(state.tournament.isComplete).toBe(true);
		});
	});

	describe("resetTournament", () => {
		it("should reset names, isComplete, and voteHistory", () => {
			useStore.getState().tournamentActions.setNames([{ id: "1", name: "Alice" }]);
			useStore.getState().tournamentActions.setComplete(true);
			useStore.getState().tournamentActions.recordVote("winner1", "loser1");

			useStore.getState().tournamentActions.resetTournament();

			const state = useStore.getState();
			expect(state.tournament.names).toBeNull();
			expect(state.tournament.isComplete).toBe(false);
			expect(state.tournament.voteHistory).toEqual([]);
		});
	});

	describe("setSelection", () => {
		it("should update selectedNames", () => {
			const selection: NameItem[] = [{ id: "1", name: "Alice" }];
			useStore.getState().tournamentActions.setSelection(selection);

			expect(useStore.getState().tournament.selectedNames).toEqual(selection);
		});
	});

	describe("recordVote", () => {
		it("should add a vote without member ids", () => {
			useStore.getState().tournamentActions.recordVote("winner1", "loser1");

			const state = useStore.getState();
			expect(state.tournament.voteHistory).toHaveLength(1);
			expect(state.tournament.voteHistory[0]).toEqual({
				winnerId: "winner1",
				loserId: "loser1",
				timestamp: new Date("2023-01-01T00:00:00Z").getTime(),
			});
		});

		it("should add a vote with member ids", () => {
			useStore.getState().tournamentActions.recordVote("winner1", "loser1", ["w1"], ["l1"]);

			const state = useStore.getState();
			expect(state.tournament.voteHistory).toHaveLength(1);
			expect(state.tournament.voteHistory[0]).toEqual({
				winnerId: "winner1",
				loserId: "loser1",
				winnerMemberIds: ["w1"],
				loserMemberIds: ["l1"],
				timestamp: new Date("2023-01-01T00:00:00Z").getTime(),
			});
		});
	});

	describe("clearVoteHistory", () => {
		it("should clear the vote history", () => {
			useStore.getState().tournamentActions.recordVote("winner1", "loser1");
			expect(useStore.getState().tournament.voteHistory).toHaveLength(1);

			useStore.getState().tournamentActions.clearVoteHistory();
			expect(useStore.getState().tournament.voteHistory).toEqual([]);
		});
	});
});
