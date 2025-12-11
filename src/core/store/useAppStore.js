import { create } from "zustand";
import { useEffect } from "react";
import {
  attachMediaQueryListener,
  getMediaQueryList,
  getMediaQueryMatches,
} from "../../shared/utils/mediaQueries";
import { siteSettingsAPI } from "../../shared/services/supabase/api";
import { updateSupabaseUserContext } from "../../shared/services/supabase/client";

const LOG_ENDPOINT = `http://${typeof window !== "undefined" ? window.location.hostname : "127.0.0.1"}:7242/ingest/1f557b52-909f-4217-87a5-26efd857b93b`;

// * Devtools middleware disabled entirely to avoid prod crashes
const applyDevtools = (storeImpl) => {
  // #region agent log
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "H2",
      location: "useAppStore.js:applyDevtools",
      message: "applyDevtools invoked",
      data: { env: process.env.NODE_ENV },
      timestamp: Date.now(),
    }),
  }).catch(() => { });
  // #endregion
  return storeImpl;
};

const THEME_STORAGE_KEY = "theme";
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = () =>
  getMediaQueryMatches(COLOR_SCHEME_QUERY) ? "dark" : "light";

const normalizeStoredTheme = (value) => {
  if (value === "light" || value === "dark") {
    return value;
  }

  return null;
};

export const getInitialThemeState = () => {
  return {
    theme: "dark",
    themePreference: "dark",
  };
};

let hasSubscribedToSystemTheme = false;

const subscribeToSystemTheme = (set, get) => {
  if (hasSubscribedToSystemTheme) {
    return;
  }

  const mediaQuery = getMediaQueryList(COLOR_SCHEME_QUERY);
  if (!mediaQuery) {
    return;
  }

  const handleChange = (event) => {
    const matches =
      typeof event?.matches === "boolean" ? event.matches : mediaQuery.matches;

    if (get().ui.themePreference !== "system") {
      return;
    }

    const nextTheme = matches ? "dark" : "light";

    set((state) => {
      if (state.ui.theme === nextTheme) {
        return state;
      }

      return {
        ui: {
          ...state.ui,
          theme: nextTheme,
        },
      };
    });
  };

  attachMediaQueryListener(mediaQuery, handleChange);

  hasSubscribedToSystemTheme = true;

  const preferredTheme = mediaQuery.matches ? "dark" : "light";
  if (
    get().ui.themePreference === "system" &&
    get().ui.theme !== preferredTheme
  ) {
    set((state) => ({
      ui: {
        ...state.ui,
        theme: preferredTheme,
      },
    }));
  }
};

const getInitialUserState = () => {
  const defaultState = {
    name: "",
    isLoggedIn: false,
    isAdmin: false,
    preferences: {},
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const storedUser = window.localStorage.getItem("catNamesUser");
    if (storedUser && storedUser.trim()) {
      return {
        ...defaultState,
        name: storedUser.trim(),
        isLoggedIn: true,
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Unable to read stored user from localStorage:", error);
    }
  }

  return defaultState;
};

/**
 * @module useAppStore
 * @description Centralized state management for the entire application using Zustand.
 * Consolidates tournament state, user state, UI state, and actions into a single store.
 */

// * Store implementation
const storeImpl = (set, get) => ({
  // * Tournament State
  tournament: {
    names: null,
    ratings: {},
    isComplete: false,
    isLoading: false,
    voteHistory: [],
    currentView: "tournament",
  },

  // * User State
  user: getInitialUserState(),

  // * UI State
  ui: {
    ...getInitialThemeState(),
    showGlobalAnalytics: false,
    showUserComparison: false,
    matrixMode: false,
  },

  // * Site Settings State
  siteSettings: {
    catChosenName: null,
    isLoaded: false,
  },

  // * Error State
  errors: {
    current: null,
    history: [],
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

  // * User Actions
  userActions: {
    setUser: (userData) =>
      set((state) => {
        const newUser = {
          ...state.user,
          ...userData,
        };
        // * Persist to localStorage
        try {
          if (newUser.name) {
            localStorage.setItem("catNamesUser", newUser.name);
          } else {
            localStorage.removeItem("catNamesUser");
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error updating localStorage:", error);
          }
        }
        return {
          user: newUser,
        };
      }),

    login: (userName) =>
      set((state) => {
        const newUser = {
          ...state.user,
          name: userName,
          isLoggedIn: true,
        };
        // * Persist to localStorage
        try {
          localStorage.setItem("catNamesUser", userName);
          // Update Supabase client headers for RLS policies
          updateSupabaseUserContext(userName);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error updating localStorage:", error);
          }
        }
        return {
          user: newUser,
        };
      }),

    logout: () =>
      set((state) => {
        // * Clear localStorage
        try {
          localStorage.removeItem("catNamesUser");
          // Clear Supabase client headers
          updateSupabaseUserContext(null);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error clearing localStorage:", error);
          }
        }
        return {
          user: {
            ...state.user,
            name: "",
            isLoggedIn: false,
            isAdmin: false,
          },
          tournament: {
            ...state.tournament,
            names: null,
            isComplete: false,
            voteHistory: [],
          },
        };
      }),

    setAdminStatus: (isAdmin) =>
      set((state) => ({
        user: {
          ...state.user,
          isAdmin,
        },
      })),

    // * Initialize user from localStorage
    initializeFromStorage: () =>
      set((state) => {
        try {
          const storedUser = localStorage.getItem("catNamesUser");
          if (storedUser && state.user.name !== storedUser) {
            // Update Supabase client headers for RLS policies
            updateSupabaseUserContext(storedUser);
            return {
              user: {
                ...state.user,
                name: storedUser,
                isLoggedIn: true,
              },
            };
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error reading from localStorage:", error);
          }
        }
        return state;
      }),
  },

  // * UI Actions
  uiActions: {
    // * Initialize theme from DOM and system preference
    initializeTheme: () => {
      if (typeof document !== "undefined") {
        const domTheme = document.documentElement?.dataset?.theme;
        if (domTheme === "light" || domTheme === "dark") {
          const { theme, themePreference } = get().ui;
          if (themePreference === "system" && theme !== domTheme) {
            set((state) => ({
              ui: {
                ...state.ui,
                theme: domTheme,
              },
            }));
          }
        }
      }

      subscribeToSystemTheme(set, get);
    },

    setTheme: (nextPreference) => {
      if (!["light", "dark", "system"].includes(nextPreference)) {
        return;
      }

      const isSystemPreference = nextPreference === "system";
      const themeToApply = isSystemPreference
        ? getSystemTheme()
        : nextPreference;

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          if (isSystemPreference) {
            window.localStorage.removeItem(THEME_STORAGE_KEY);
          } else {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error updating theme localStorage:", error);
        }
      }

      set((state) => ({
        ui: {
          ...state.ui,
          theme: themeToApply,
          themePreference: isSystemPreference ? "system" : nextPreference,
        },
      }));

      if (isSystemPreference) {
        subscribeToSystemTheme(set, get);
      }
    },

    toggleTheme: () => {
      const currentTheme = get().ui.theme;
      const newTheme = currentTheme === "light" ? "dark" : "light";

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error updating theme localStorage:", error);
        }
      }

      set((state) => ({
        ui: {
          ...state.ui,
          theme: newTheme,
          themePreference: newTheme,
        },
      }));
    },

    setMatrixMode: (enabled) =>
      set((state) => ({
        ui: {
          ...state.ui,
          matrixMode: enabled,
        },
      })),

    setGlobalAnalytics: (show) =>
      set((state) => ({
        ui: {
          ...state.ui,
          showGlobalAnalytics: show,
        },
      })),

    setUserComparison: (show) =>
      set((state) => ({
        ui: {
          ...state.ui,
          showUserComparison: show,
        },
      })),
  },

  // * Error Actions
  errorActions: {
    setError: (error) =>
      set((state) => ({
        errors: {
          current: error,
          history: error
            ? [...state.errors.history, error]
            : state.errors.history,
        },
      })),

    clearError: () =>
      set((state) => ({
        errors: {
          ...state.errors,
          current: null,
        },
      })),

    logError: (error, context, metadata = {}) => {
      const errorLog = {
        error,
        context,
        metadata,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        errors: {
          ...state.errors,
          history: [...state.errors.history, errorLog],
        },
      }));

      // * Log to console for development
      if (process.env.NODE_ENV === "development") {
        console.error("Error logged:", errorLog);
      }
    },
  },

  // * Site Settings Actions
  siteSettingsActions: {
    loadCatChosenName: async () => {
      try {
        const data = await siteSettingsAPI.getCatChosenName();
        set((state) => ({
          siteSettings: {
            ...state.siteSettings,
            catChosenName: data,
            isLoaded: true,
          },
        }));
        return data;
      } catch (error) {
        console.error("Error loading cat chosen name:", error);
        set((state) => ({
          siteSettings: {
            ...state.siteSettings,
            isLoaded: true,
          },
        }));
        return null;
      }
    },

    updateCatChosenName: (nameData) =>
      set((state) => ({
        siteSettings: {
          ...state.siteSettings,
          catChosenName: nameData,
        },
      })),
  },

  // * Computed Selectors
  selectors: {
    getTournamentNames: () => get().tournament.names,
    getRatings: () => get().tournament.ratings,
    getIsComplete: () => get().tournament.isComplete,
    getIsLoading: () => get().tournament.isLoading,
    getVoteHistory: () => get().tournament.voteHistory,
    getCurrentView: () => get().tournament.currentView,
    getUserName: () => get().user.name,
    getIsLoggedIn: () => get().user.isLoggedIn,
    getIsAdmin: () => get().user.isAdmin,
    getTheme: () => get().ui.theme,

    getCurrentError: () => get().errors.current,
  },
});

// * Create store without any devtools integration (safest for production)
const useAppStore = create(
  applyDevtools(storeImpl, {
    name: "name-nosferatu-store",
  }),
);
// #region agent log
fetch(LOG_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: "debug-session",
    runId: "run1",
    hypothesisId: "H2",
    location: "useAppStore.js:store-created",
    message: "store created",
    data: { env: process.env.NODE_ENV },
    timestamp: Date.now(),
  }),
}).catch(() => { });
// #endregion

// * Hook to initialize store from localStorage
export const useAppStoreInitialization = () => {
  const { userActions, uiActions } = useAppStore();

  useEffect(() => {
    // * Initialize user state from localStorage on mount
    userActions.initializeFromStorage();
    // * Initialize theme state from localStorage on mount
    uiActions.initializeTheme();
  }, [userActions, uiActions]);
};

// * Computed selectors for derived state
export const selectTournamentStats = (state) => {
  const totalNames = state.tournament.names?.length || 0;
  const totalVotes = state.tournament.voteHistory.length;
  const totalPossibleMatches =
    totalNames > 1 ? (totalNames * (totalNames - 1)) / 2 : 0;

  return {
    totalNames,
    totalVotes,
    isComplete: state.tournament.isComplete,
    isLoading: state.tournament.isLoading,
    progress:
      totalPossibleMatches > 0 ? (totalVotes / totalPossibleMatches) * 100 : 0,
  };
};

export default useAppStore;
