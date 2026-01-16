import type { StateCreator } from "zustand";
import type { AppState } from "../../../types/store";
import { updateSlice } from "../utils";

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
  },

  tournamentActions: {
    setNames: (names) =>
      updateSlice(set, "tournament", {
        names:
          names?.map((n) => ({
            id: n.id,
            name: n.name,
            description: n.description,
            rating: _get().tournament.ratings[n.name]?.rating || 1500,
          })) || null,
      }),

    setRatings: (ratings) =>
      updateSlice(set, "tournament", {
        ratings: { ..._get().tournament.ratings, ...ratings },
      }),

    setComplete: (isComplete) => updateSlice(set, "tournament", { isComplete }),

    setLoading: (isLoading) => updateSlice(set, "tournament", { isLoading }),

    addVote: (vote) =>
      updateSlice(set, "tournament", {
        voteHistory: [..._get().tournament.voteHistory, vote],
      }),

    resetTournament: () =>
      updateSlice(set, "tournament", {
        names: null,
        isComplete: false,
        voteHistory: [],
        isLoading: false,
      }),
  },
});
