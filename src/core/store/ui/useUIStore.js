/**
 * @module useUIStore
 * @description UI state management (theme, modals, notifications)
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  attachMediaQueryListener,
  getMediaQueryList,
  getMediaQueryMatches,
} from "../../../shared/utils/mediaQueries";

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

export const useUIStore = create(
  devtools(
    (set, get) => ({
      // * UI State
      ui: {
        ...getInitialThemeState(),
        showPerformanceDashboard: false,
        showGlobalAnalytics: false,
        showUserComparison: false,
        matrixMode: false,
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
    }),
    {
      name: "ui-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

export default useUIStore;
