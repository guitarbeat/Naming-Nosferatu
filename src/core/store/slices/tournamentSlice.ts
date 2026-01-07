import type { StateCreator } from "zustand";
import type { AppState } from "../../../types/store";

export const createTournamentSlice: StateCreator<
	AppState,
	[],
	[],
	Pick<AppState, "tournament" | "tournamentActions">
> = (set, _get) => ({
	tournament: {
		names: null,
		ratings: {},
		isComplete: false,
		isLoading: false,
		voteHistory: [],
		currentView: "tournament",
	},

	tournamentActions: {
		setNames: (names) =>
			set((state) => ({
				tournament: {
					...state.tournament,
					names:
						names?.map((n) => ({
							id: n.id,
							name: n.name,
							description: n.description,
							rating: state.tournament.ratings[n.name]?.rating || 1500,
						})) || null,
				},
			})),

		setRatings: (ratings) =>
			set((state) => ({
				tournament: {
					...state.tournament,
					ratings: { ...state.tournament.ratings, ...ratings },
				},
			})),

		setComplete: (isComplete) =>
			set((state) => ({
				tournament: {
					...state.tournament,
					isComplete,
				},
			})),

		setLoading: (isLoading) =>
			set((state) => ({
				tournament: {
					...state.tournament,
					isLoading,
				},
			})),

		addVote: (vote) =>
			set((state) => ({
				tournament: {
					...state.tournament,
					voteHistory: [...state.tournament.voteHistory, vote],
				},
			})),

		resetTournament: () =>
			set((state) => ({
				tournament: {
					...state.tournament,
					names: null,
					isComplete: false,
					voteHistory: [],
					isLoading: false, // * Explicitly set loading to false to prevent flashing
					currentView: "tournament", // * Reset view to allow starting new tournament
				},
			})),

		setView: (view) =>
			set((state) => ({
				tournament: {
					...state.tournament,
					currentView: view,
				},
			})),
	},
});
