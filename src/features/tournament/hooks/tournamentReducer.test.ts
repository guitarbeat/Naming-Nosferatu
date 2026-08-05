import { describe, expect, it, vi } from "vitest";
import type { MatchRecord, PersistentTournamentState } from "@/shared/types";
import type { HistoryEntry } from "../utils/tournamentLogic";
import {
	type TournamentAction,
	type TournamentReducerState,
	tournamentReducer,
} from "./tournamentReducer";

// Mock the tournamentLogic module
vi.mock("../utils/tournamentLogic", () => ({
	computeUpdatedRatings: vi.fn().mockReturnValue({ p1: 1515, p2: 1485 }),
	createMatchRecord: vi.fn().mockImplementation((opts) => ({
		match: opts.currentMatch,
		winner: opts.winnerId,
		loser: opts.loserId,
		voteType: "normal",
		matchNumber: opts.matchNumber,
		roundNumber: opts.round,
		timestamp: 1234567890,
	})),
}));

describe("tournamentReducer", () => {
	const defaultPersistentState: PersistentTournamentState = {
		matchHistory: [],
		currentRound: 1,
		currentMatch: 1,
		totalMatches: 3,
		userName: "TestUser",
		lastUpdated: 0,
		namesKey: "test",
		ratings: {},
		mode: "1v1",
		teams: [],
	};

	const initialState: TournamentReducerState = {
		ratings: {},
		history: [],
		persistentState: defaultPersistentState,
		refreshKey: 0,
	};

	it("handles INIT action", () => {
		const action: TournamentAction = {
			type: "INIT",
			payload: {
				ratings: { p1: 1500, p2: 1500 },
				persistentState: { ...defaultPersistentState, currentMatch: 2 },
			},
		};

		const newState = tournamentReducer(initialState, action);

		expect(newState.ratings).toEqual({ p1: 1500, p2: 1500 });
		expect(newState.history).toEqual([]);
		expect(newState.persistentState.currentMatch).toBe(2);
		expect(newState.refreshKey).toBe(1);
	});

	it("handles VOTE action", () => {
		const state: TournamentReducerState = {
			...initialState,
			ratings: { p1: 1500, p2: 1500 },
		};

		const action: TournamentAction = {
			type: "VOTE",
			payload: {
				currentMatch: {
					mode: "1v1",
					left: { id: "p1", name: "Player 1" },
					right: { id: "p2", name: "Player 2" },
				},
				winnerId: "p1",
				loserId: "p2",
				matchNumber: 1,
				round: 1,
				voteTimestamp: 1234567890,
				userName: "TestUser",
			},
		};

		const newState = tournamentReducer(state, action);

		// Verifies that computeUpdatedRatings logic was used (mock returns 1515/1485)
		expect(newState.ratings).toEqual({ p1: 1515, p2: 1485 });

		// History is appended with new entry
		expect(newState.history).toHaveLength(1);
		expect(newState.history[0].matchNumber).toBe(1);
		expect(newState.history[0].ratings).toEqual({ p1: 1500, p2: 1500 }); // previous ratings

		// Persistent state is updated
		expect(newState.persistentState.matchHistory).toHaveLength(1);
		expect(newState.persistentState.currentMatch).toBe(2);
		expect(newState.persistentState.lastUpdated).toBe(1234567890);
		expect(newState.persistentState.ratings).toEqual({ p1: 1515, p2: 1485 });

		expect(newState.refreshKey).toBe(1);
	});

	it("handles UNDO action", () => {
		const mockMatch = {
			mode: "1v1" as const,
			left: { id: "p1", name: "Player 1" },
			right: { id: "p2", name: "Player 2" },
		};
		const lastEntry: HistoryEntry = {
			match: mockMatch,
			ratings: { p1: 1500, p2: 1500 },
			round: 1,
			matchNumber: 1,
		};
		const matchRecord: MatchRecord = {
			match: mockMatch,
			winner: "p1",
			loser: "p2",
			voteType: "normal",
			matchNumber: 1,
			roundNumber: 1,
			timestamp: 1234567890,
		};

		const stateWithHistory: TournamentReducerState = {
			...initialState,
			ratings: { p1: 1515, p2: 1485 },
			history: [lastEntry],
			persistentState: {
				...defaultPersistentState,
				matchHistory: [matchRecord],
				currentMatch: 2,
				currentRound: 1,
			},
		};

		const action: TournamentAction = {
			type: "UNDO",
			payload: { lastEntry },
		};

		const newState = tournamentReducer(stateWithHistory, action);

		expect(newState.ratings).toEqual({ p1: 1500, p2: 1500 });
		expect(newState.history).toHaveLength(0);
		expect(newState.persistentState.matchHistory).toHaveLength(0);
		expect(newState.persistentState.currentMatch).toBe(1);
		expect(newState.persistentState.currentRound).toBe(1);
		expect(newState.refreshKey).toBe(1);
	});

	it("handles QUIT action", () => {
		const stateWithData: TournamentReducerState = {
			...initialState,
			ratings: { p1: 1500 },
			history: [
				{
					match: {
						mode: "1v1",
						left: { id: "p1", name: "P1" },
						right: { id: "p2", name: "P2" },
					},
					ratings: {},
					round: 1,
					matchNumber: 1,
				},
			],
		};

		const action: TournamentAction = {
			type: "QUIT",
			payload: {
				defaultState: defaultPersistentState,
			},
		};

		const newState = tournamentReducer(stateWithData, action);

		expect(newState.ratings).toEqual({});
		expect(newState.history).toEqual([]);
		expect(newState.persistentState).toEqual(defaultPersistentState);
		expect(newState.refreshKey).toBe(1);
	});

	it("returns state unchanged for unknown action", () => {
		const action = { type: "UNKNOWN" } as unknown as TournamentAction;
		const newState = tournamentReducer(initialState, action);

		expect(newState).toBe(initialState);
	});
});
