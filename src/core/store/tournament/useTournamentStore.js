/**
 * @module useTournamentStore
 * @description Tournament-specific state management
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useTournamentStore = create(
  devtools(
    (set) => ({
      // * Tournament State
      tournament: {
        names: null,
        ratings: {},
        isComplete: false,
        isLoading: false,
        voteHistory: [],
        currentView: "tournament",
      },

      // * Tournament Actions
      tournamentActions: {
        setNames: (names) =>
          set((state) => ({
            tournament: {
              ...state.tournament,
              names: names?.map((n) => ({
                id: n.id,
                name: n.name,
                description: n.description,
                rating: state.tournament.ratings[n.name]?.rating || 1500,
              })),
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
    }),
    {
      name: "tournament-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

export default useTournamentStore;
