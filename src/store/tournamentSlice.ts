import {
	clearStoredTournamentFromIDB,
	saveStoredTournamentToIDB,
} from "@/shared/lib/indexedDB";
import {
	clearStoredTournamentSnapshot,
	readStoredTournamentSnapshot,
	type StoredTournamentSnapshot,
	writeStoredTournamentSnapshot,
} from "@/shared/lib/storage";
import type { TournamentState } from "@/shared/types";
import type { AppSliceCreator, AppState } from "./types";
import { IS_BROWSER, patch } from "./utils";

export function getInitialTournamentState(): TournamentState {
	const base: TournamentState = {
		names: null,
		ratings: {},
		isComplete: false,
		isLoading: false,
		voteHistory: [],
		selectedNames: [],
	};

	if (!IS_BROWSER) {
		return base;
	}

	const stored = readStoredTournamentSnapshot();
	if (!stored) {
		return base;
	}

	return {
		...base,
		names: stored.names ?? null,
		ratings: stored.ratings ?? {},
		isComplete: Boolean(stored.isComplete),
		voteHistory: Array.isArray(stored.voteHistory) ? stored.voteHistory : [],
		selectedNames: Array.isArray(stored.selectedNames)
			? stored.selectedNames
			: [],
		matchHistory: Array.isArray(stored.matchHistory)
			? stored.matchHistory
			: undefined,
		currentRound:
			typeof stored.currentRound === "number" ? stored.currentRound : undefined,
		currentMatch:
			typeof stored.currentMatch === "number" ? stored.currentMatch : undefined,
		totalMatches:
			typeof stored.totalMatches === "number" ? stored.totalMatches : undefined,
		mode: stored.mode,
		teams: stored.teams,
		bracketEntrants: stored.bracketEntrants,
		lastUpdated: stored.lastUpdated,
	};
}

export function persistTournamentState(tournament: TournamentState): void {
	if (!IS_BROWSER) {
		return;
	}

	if (
		!tournament.names &&
		(!tournament.selectedNames || tournament.selectedNames.length === 0) &&
		(!tournament.ratings || Object.keys(tournament.ratings).length === 0) &&
		(!tournament.voteHistory || tournament.voteHistory.length === 0) &&
		(!tournament.matchHistory || tournament.matchHistory.length === 0)
	) {
		clearStoredTournamentSnapshot();
		void clearStoredTournamentFromIDB();
		return;
	}

	const snapshot: StoredTournamentSnapshot = {
		names: tournament.names,
		ratings: tournament.ratings,
		isComplete: tournament.isComplete,
		voteHistory: tournament.voteHistory,
		selectedNames: tournament.selectedNames,
		matchHistory: tournament.matchHistory,
		currentRound: tournament.currentRound,
		currentMatch: tournament.currentMatch,
		totalMatches: tournament.totalMatches,
		mode: tournament.mode,
		teams: tournament.teams,
		bracketEntrants: tournament.bracketEntrants,
		lastUpdated: Date.now(),
	};

	writeStoredTournamentSnapshot(snapshot);
	void saveStoredTournamentToIDB(snapshot);
}

export const createTournamentSlice: AppSliceCreator<
	Pick<AppState, "tournament" | "tournamentActions">
> = (set, get) => ({
	tournament: getInitialTournamentState(),

	tournamentActions: {
		setNames: (names) => {
			const currentRatings = get().tournament.ratings;
			const processedNames =
				names?.map((name) => {
					const entry = currentRatings[name.id] ?? currentRatings[name.name];
					const ratingVal =
						typeof entry === "number"
							? entry
							: typeof entry === "object" && entry !== null
								? entry.rating
								: undefined;

					return {
						...name,
						rating:
							ratingVal ??
							name.rating ??
							name.avgRating ??
							name.avg_rating ??
							1500,
					};
				}) ?? null;

			const nextTournament: TournamentState = {
				...get().tournament,
				names: processedNames,
				isComplete: false,
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				bracketEntrants: [],
				voteHistory: [],
			};
			patch(set, "tournament", {
				names: processedNames,
				isComplete: false,
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				bracketEntrants: [],
				voteHistory: [],
			});
			persistTournamentState(nextTournament);
		},

		setRatings: (ratingsOrFn) => {
			const current = get().tournament.ratings;
			const nextRatings =
				typeof ratingsOrFn === "function" ? ratingsOrFn(current) : ratingsOrFn;
			const mergedRatings = { ...current, ...nextRatings };
			const nextTournament = {
				...get().tournament,
				ratings: mergedRatings,
			};
			patch(set, "tournament", { ratings: mergedRatings });
			persistTournamentState(nextTournament);
		},

		setComplete: (isComplete) => {
			const nextTournament = {
				...get().tournament,
				isComplete,
			};
			patch(set, "tournament", { isComplete });
			persistTournamentState(nextTournament);
		},

		completeTournament: (ratings) => {
			const current = get().tournament.ratings;
			const mergedRatings = { ...current, ...ratings };
			const nextTournament = {
				...get().tournament,
				ratings: mergedRatings,
				isComplete: true,
			};
			patch(set, "tournament", {
				ratings: mergedRatings,
				isComplete: true,
			});
			persistTournamentState(nextTournament);
		},

		resetTournament: () => {
			const nextTournament: TournamentState = {
				...get().tournament,
				names: null,
				isComplete: false,
				voteHistory: [],
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				bracketEntrants: [],
				ratings: {},
			};
			patch(set, "tournament", {
				names: null,
				isComplete: false,
				voteHistory: [],
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				bracketEntrants: [],
				ratings: {},
			});
			persistTournamentState(nextTournament);
		},

		setSelection: (selectedNames) => {
			const nextTournament = {
				...get().tournament,
				selectedNames,
			};
			patch(set, "tournament", { selectedNames });
			persistTournamentState(nextTournament);
		},

		recordVote: (winnerId, loserId, winnerMemberIds, loserMemberIds) => {
			const prev = get().tournament.voteHistory;
			const newVote = {
				winnerId,
				loserId,
				timestamp: Date.now(),
				...(winnerMemberIds ? { winnerMemberIds } : {}),
				...(loserMemberIds ? { loserMemberIds } : {}),
			};
			const nextHistory = [...prev, newVote];
			const nextTournament = {
				...get().tournament,
				voteHistory: nextHistory,
			};
			patch(set, "tournament", {
				voteHistory: nextHistory,
			});
			persistTournamentState(nextTournament);
		},

		undoVote: () => {
			const prev = get().tournament.voteHistory;
			const nextHistory = prev.slice(0, -1);
			const prevMatchHistory = get().tournament.matchHistory;
			const nextMatchHistory = prevMatchHistory
				? prevMatchHistory.slice(0, -1)
				: undefined;
			const nextTournament = {
				...get().tournament,
				voteHistory: nextHistory,
				matchHistory: nextMatchHistory,
			};
			patch(set, "tournament", {
				voteHistory: nextHistory,
				matchHistory: nextMatchHistory,
			});
			persistTournamentState(nextTournament);
		},

		syncTournamentProgress: (progressUpdates) => {
			const current = get().tournament;
			const nextRatings = progressUpdates.ratings
				? { ...current.ratings, ...progressUpdates.ratings }
				: current.ratings;
			const nextTournament: TournamentState = {
				...current,
				...progressUpdates,
				ratings: nextRatings,
				lastUpdated: Date.now(),
			};
			patch(set, "tournament", {
				...progressUpdates,
				ratings: nextRatings,
				lastUpdated: nextTournament.lastUpdated,
			});
			persistTournamentState(nextTournament);
		},

		clearVoteHistory: () => {
			const nextTournament = {
				...get().tournament,
				voteHistory: [],
			};
			patch(set, "tournament", { voteHistory: [] });
			persistTournamentState(nextTournament);
		},

		replaceTournamentState: (snapshot: TournamentState) => {
			set({ tournament: { ...snapshot } });
			persistTournamentState(snapshot);
		},
	},
});
