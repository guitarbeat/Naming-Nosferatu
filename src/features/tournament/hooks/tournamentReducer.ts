import type { Match, MatchRecord, PersistentTournamentState } from "@/shared/types";
import type { HistoryEntry } from "../utils/tournamentLogic";
import { computeUpdatedRatings, createMatchRecord } from "../utils/tournamentLogic";

export type TournamentAction =
	| {
			type: "INIT";
			payload: {
				ratings: Record<string, number>;
				persistentState: PersistentTournamentState;
			};
	  }
	| {
			type: "VOTE";
			payload: {
				currentMatch: Match;
				winnerId: string;
				loserId: string;
				matchNumber: number;
				round: number;
				voteTimestamp: number;
				userName: string;
			};
	  }
	| {
			type: "UNDO";
			payload: {
				lastEntry: HistoryEntry;
			};
	  }
	| {
			type: "QUIT";
			payload: {
				defaultState: PersistentTournamentState;
			};
	  };

export interface TournamentReducerState {
	ratings: Record<string, number>;
	history: HistoryEntry[];
	persistentState: PersistentTournamentState;
	refreshKey: number;
}

export function tournamentReducer(
	state: TournamentReducerState,
	action: TournamentAction,
): TournamentReducerState {
	switch (action.type) {
		case "INIT": {
			return {
				ratings: action.payload.ratings,
				history: [],
				persistentState: action.payload.persistentState,
				refreshKey: state.refreshKey + 1,
			};
		}
		case "VOTE": {
			const { currentMatch, winnerId, loserId, matchNumber, round, voteTimestamp } = action.payload;

			const newRatings = computeUpdatedRatings({
				currentMatch,
				ratingsSnapshot: state.ratings,
				winnerId,
				loserId,
			});

			const matchRecord: MatchRecord = createMatchRecord({
				currentMatch,
				winnerId,
				loserId,
				matchNumber,
				round,
			});

			const newHistoryEntry: HistoryEntry = {
				match: currentMatch,
				ratings: { ...state.ratings },
				round,
				matchNumber,
			};

			return {
				...state,
				ratings: newRatings,
				history: [...state.history, newHistoryEntry],
				persistentState: {
					...state.persistentState,
					matchHistory: [...(state.persistentState.matchHistory || []), matchRecord],
					currentMatch: matchNumber + 1,
					currentRound: round,
					ratings: newRatings,
					lastUpdated: voteTimestamp,
				},
				refreshKey: state.refreshKey + 1,
			};
		}
		case "UNDO": {
			const { lastEntry } = action.payload;
			const newHistory = state.history.slice(0, -1);
			const newMatchHistory = (state.persistentState.matchHistory || []).slice(0, -1);

			return {
				...state,
				ratings: lastEntry.ratings,
				history: newHistory,
				persistentState: {
					...state.persistentState,
					matchHistory: newMatchHistory,
					ratings: lastEntry.ratings,
				},
				refreshKey: state.refreshKey + 1,
			};
		}
		case "QUIT": {
			return {
				ratings: {},
				history: [],
				persistentState: action.payload.defaultState,
				refreshKey: state.refreshKey + 1,
			};
		}
		default:
			return state;
	}
}
