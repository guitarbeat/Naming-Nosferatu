import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEffect } from "react";
import {
  attachMediaQueryListener,
  getMediaQueryList,
  getMediaQueryMatches,
} from "../../shared/utils/mediaQueries";
import { siteSettingsAPI } from "../../integrations/supabase/api";

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
  const defaultState = {
    theme: "light",
    themePreference: "system",
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  let storedPreference = null;

  try {
    const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
    const normalized = normalizeStoredTheme(stored);

    if (normalized) {
      if (stored !== normalized && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
      }
      storedPreference = normalized;
    } else if (stored && window.localStorage) {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Unable to read stored theme from localStorage:", error);
    }
  }

  if (storedPreference) {
    return {
      theme: storedPreference,
      themePreference: storedPreference,
    };
  }

  const domTheme =
    typeof document !== "undefined"
      ? document.documentElement?.dataset?.theme
      : null;

  if (domTheme === "light" || domTheme === "dark") {
    return {
      theme: domTheme,
      themePreference: "system",
    };
  }

  return {
    theme: getSystemTheme(),
    themePreference: "system",
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

const useAppStore = create(
  devtools(
    (set, get) => ({
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
        showPerformanceDashboard: false,
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

        setPerformanceDashboardVisible: (show) =>
          set((state) => ({
            ui: {
              ...state.ui,
              showPerformanceDashboard: !!show,
            },
          })),

        togglePerformanceDashboard: () =>
          set((state) => ({
            ui: {
              ...state.ui,
              showPerformanceDashboard: !state.ui.showPerformanceDashboard,
            },
          })),

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
        getShowPerformanceDashboard: () => get().ui.showPerformanceDashboard,

        getCurrentError: () => get().errors.current,
      },
    }),
    {
      name: "name-nosferatu-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

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
