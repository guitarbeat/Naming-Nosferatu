import { useEffect } from "react";
import { create, type StateCreator } from "zustand";
import type { AppState } from "../../types/store";
import { createErrorSlice } from "./slices/errorSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createTournamentSlice } from "./slices/tournamentSlice";
import { createUserSlice } from "./slices/userSlice";

// * Devtools middleware disabled entirely to avoid prod crashes
const applyDevtools = (storeImpl: StateCreator<AppState>) => {
  return storeImpl;
};

/**
 * @module useAppStore
 * @description Centralized state management for the entire application using Zustand.
 * Consolidates tournament state, user state, UI state, and actions into a single store via slices.
 */
const useAppStore = create<AppState>()(
  applyDevtools((...a) => ({
    ...createTournamentSlice(...a),
    ...createUserSlice(...a),
    ...createSettingsSlice(...a),
    ...createErrorSlice(...a),

    // * Computed Selectors
    // We define these here because they rely on the full store state access
    selectors: {
      getTournamentNames: () => a[1]().tournament.names,
      getRatings: () => a[1]().tournament.ratings,
      getIsComplete: () => a[1]().tournament.isComplete,
      getIsLoading: () => a[1]().tournament.isLoading,
      getVoteHistory: () => a[1]().tournament.voteHistory,
      getUserName: () => a[1]().user.name,
      getIsLoggedIn: () => a[1]().user.isLoggedIn,
      getIsAdmin: () => a[1]().user.isAdmin,
      getTheme: () => a[1]().ui.theme,
      getCurrentError: () => a[1]().errors.current,
    },
  })),
);

// * Hook to initialize store from localStorage
export const useAppStoreInitialization = () => {
  const { userActions } = useAppStore();

  useEffect(() => {
    // * Initialize user state from localStorage on mount
    userActions.initializeFromStorage();
  }, [userActions]);
};

export default useAppStore;
