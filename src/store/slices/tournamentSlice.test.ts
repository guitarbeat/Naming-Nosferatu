import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import type { AppState, NameItem } from "@/store/appStore.types";
import { createTournamentSlice } from "./tournamentSlice";

describe("tournamentSlice", () => {
	type StoreType = Pick<AppState, "tournament" | "tournamentActions">;
	let useStore: ReturnType<typeof create<StoreType>>;

	beforeEach(() => {
		useStore = create<StoreType>()((set, get, api) => ({
			...createTournamentSlice(
				// @ts-expect-error Mocking zustand store args
				set,
				// @ts-expect-error Mocking zustand store args
				get,
				// @ts-expect-error Mocking zustand store args
				api,
			),
		}));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("initializes with default state", () => {
		const state = useStore.getState().tournament;
		expect(state.names).toBeNull();
		expect(state.ratings).toEqual({});
		expect(state.isComplete).toBe(false);
		expect(state.isLoading).toBe(false);
		expect(state.voteHistory).toEqual([]);
		expect(state.selectedNames).toEqual([]);
	});

	describe("setNames", () => {
		it("sets names and assigns default rating of 1500 to new names", () => {
			const { setNames } = useStore.getState().tournamentActions;

			setNames([
				{ id: "1", name: "Alice", description: "A" } as NameItem,
				{ id: "2", name: "Bob" } as NameItem,
			]);

			const state = useStore.getState().tournament;
			expect(state.names).toEqual([
				{ id: "1", name: "Alice", description: "A", rating: 1500 },
				{ id: "2", name: "Bob", description: undefined, rating: 1500 },
			]);
		});

		it("preserves existing ratings when setting names", () => {
			const { setRatings, setNames } = useStore.getState().tournamentActions;

			setRatings({
				Alice: { rating: 1600, rd: 30, vol: 0.06 },
			});

			setNames([{ id: "1", name: "Alice" } as NameItem, { id: "2", name: "Bob" } as NameItem]);

			const state = useStore.getState().tournament;
			expect(state.names).toEqual([
				{ id: "1", name: "Alice", description: undefined, rating: 1600 },
				{ id: "2", name: "Bob", description: undefined, rating: 1500 },
			]);
		});

		it("handles setting names to null", () => {
			const { setNames } = useStore.getState().tournamentActions;

			setNames([{ id: "1", name: "Alice" } as NameItem]);
			setNames(null);

			const state = useStore.getState().tournament;
			expect(state.names).toBeNull();
		});
	});

	describe("setRatings", () => {
		it("merges new ratings with existing ratings using object", () => {
			const { setRatings } = useStore.getState().tournamentActions;

			setRatings({
				Alice: { rating: 1600, rd: 30, vol: 0.06 },
			});

			setRatings({
				Bob: { rating: 1400, rd: 30, vol: 0.06 },
			});

			const state = useStore.getState().tournament;
			expect(state.ratings).toEqual({
				Alice: { rating: 1600, rd: 30, vol: 0.06 },
				Bob: { rating: 1400, rd: 30, vol: 0.06 },
			});
		});

		it("updates ratings using an updater function", () => {
			const { setRatings } = useStore.getState().tournamentActions;

			setRatings({
				Alice: { rating: 1600, rd: 30, vol: 0.06 },
			});

			setRatings((prev) => ({
				...prev,
				Alice: { ...prev.Alice, rating: 1650 },
				Charlie: { rating: 1500, rd: 350, vol: 0.06 },
			}));

			const state = useStore.getState().tournament;
			expect(state.ratings).toEqual({
				Alice: { rating: 1650, rd: 30, vol: 0.06 },
				Charlie: { rating: 1500, rd: 350, vol: 0.06 },
			});
		});
	});

	describe("setComplete", () => {
		it("updates isComplete state", () => {
			const { setComplete } = useStore.getState().tournamentActions;

			setComplete(true);
			expect(useStore.getState().tournament.isComplete).toBe(true);

			setComplete(false);
			expect(useStore.getState().tournament.isComplete).toBe(false);
		});
	});

	describe("completeTournament", () => {
		it("merges ratings and sets isComplete to true", () => {
			const { setRatings, completeTournament } = useStore.getState().tournamentActions;

			setRatings({
				Alice: { rating: 1600, rd: 30, vol: 0.06 },
			});

			completeTournament({
				Alice: { rating: 1620, rd: 25, vol: 0.06 },
				Bob: { rating: 1500, rd: 350, vol: 0.06 },
			});

			const state = useStore.getState().tournament;
			expect(state.isComplete).toBe(true);
			expect(state.ratings).toEqual({
				Alice: { rating: 1620, rd: 25, vol: 0.06 },
				Bob: { rating: 1500, rd: 350, vol: 0.06 },
			});
		});
	});

	describe("resetTournament", () => {
		it("resets names, isComplete, and voteHistory", () => {
			const { setNames, setComplete, recordVote, resetTournament } =
				useStore.getState().tournamentActions;

			setNames([{ id: "1", name: "Alice" } as NameItem]);
			setComplete(true);
			recordVote("1", "2");

			resetTournament();

			const state = useStore.getState().tournament;
			expect(state.names).toBeNull();
			expect(state.isComplete).toBe(false);
			expect(state.voteHistory).toEqual([]);
		});
	});

	describe("setSelection", () => {
		it("updates selectedNames", () => {
			const { setSelection } = useStore.getState().tournamentActions;

			const selection = [{ id: "1", name: "Alice" }];
			setSelection(selection as NameItem[]);

			const state = useStore.getState().tournament;
			expect(state.selectedNames).toEqual(selection);
		});
	});

	describe("voteHistory", () => {
		it("records a vote with timestamp", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

			const { recordVote } = useStore.getState().tournamentActions;

			recordVote("winner1", "loser1");

			const state = useStore.getState().tournament;
			expect(state.voteHistory).toHaveLength(1);
			expect(state.voteHistory[0]).toEqual({
				winnerId: "winner1",
				loserId: "loser1",
				timestamp: 1704110400000,
			});
		});

		it("records a vote with optional member ids", () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

			const { recordVote } = useStore.getState().tournamentActions;

			recordVote("winner1", "loser1", ["mem1"], ["mem2", "mem3"]);

			const state = useStore.getState().tournament;
			expect(state.voteHistory).toHaveLength(1);
			expect(state.voteHistory[0]).toEqual({
				winnerId: "winner1",
				loserId: "loser1",
				timestamp: 1704110400000,
				winnerMemberIds: ["mem1"],
				loserMemberIds: ["mem2", "mem3"],
			});
		});

		it("clears vote history", () => {
			const { recordVote, clearVoteHistory } = useStore.getState().tournamentActions;

			recordVote("1", "2");
			recordVote("3", "4");

			expect(useStore.getState().tournament.voteHistory).toHaveLength(2);

			clearVoteHistory();

			expect(useStore.getState().tournament.voteHistory).toHaveLength(0);
		});
	});
});
