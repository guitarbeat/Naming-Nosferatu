/**
 * @module store
 * @description Centralized state management for the entire application using Zustand.
 * Combined app-wide state: tournament, UI settings, site settings, error handling, and user state.
 */

import { siteSettingsAPI, updateSupabaseUserContext } from "@supabase/client";
import { useEffect } from "react";
import { create, type StateCreator } from "zustand";
import type { AppState, CatChosenName, UIState, UserState } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";

/* ==========================================================================
   STORE UTILITIES & HELPERS
   ========================================================================== */

/**
 * Common helper for nested Zustand slice updates to reduce boilerplate spreading.
 */
export const updateSlice = <K extends keyof AppState>(
	set: (fn: (state: AppState) => Partial<AppState> | AppState) => void,
	key: K,
	updates: Partial<AppState[K]>,
) => {
	set((state) => ({
		[key]: {
			...(state[key] as object),
			...(updates as object),
		},
	}));
};

/* ==========================================================================
   TOURNAMENT SLICE
   ========================================================================== */

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
		selectedNames: [],
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

		setRatings: (ratingsOrFn) => {
			const currentRatings = _get().tournament.ratings;
			const newRatings =
				typeof ratingsOrFn === "function" ? ratingsOrFn(currentRatings) : ratingsOrFn;

			updateSlice(set, "tournament", {
				ratings: { ...currentRatings, ...newRatings },
			});
		},

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

		setSelection: (selectedNames) => updateSlice(set, "tournament", { selectedNames }),
	},
});

/* ==========================================================================
   USER & SETTINGS SLICE
   ========================================================================== */

const getInitialUserState = (): UserState => {
	const defaultState: UserState = {
		name: "",
		isLoggedIn: false,
		isAdmin: false,
		preferences: {},
	};

	if (typeof window === "undefined") return defaultState;

	try {
		const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
		if (storedUser?.trim()) {
			return { ...defaultState, name: storedUser.trim(), isLoggedIn: true };
		}
	} catch (error) {
		if (import.meta.env.DEV) console.warn("Failed to read user from localStorage", error);
	}
	return defaultState;
};

const getInitialThemeState = (): Pick<UIState, "theme" | "themePreference"> => {
	if (typeof window !== "undefined") {
		try {
			const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
			if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
				return { theme: storedTheme, themePreference: storedTheme };
			}
		} catch (e) {
			console.warn("Failed to read theme from localStorage", e);
		}
	}
	return { theme: "dark", themePreference: "dark" };
};

export const createUserAndSettingsSlice: StateCreator<
	AppState,
	[],
	[],
	Pick<
		AppState,
		"user" | "ui" | "siteSettings" | "userActions" | "uiActions" | "siteSettingsActions"
	>
> = (set, get) => ({
	user: getInitialUserState(),
	ui: {
		...getInitialThemeState(),
		showGlobalAnalytics: false,
		showUserComparison: false,
		matrixMode: false,
		isSwipeMode: false,
		showCatPictures: true,
		isEditingProfile: false,
	},
	siteSettings: {
		catChosenName: null,
		isLoaded: false,
	},

	userActions: {
		setUser: (userData) => {
			updateSlice(set, "user", userData);
			try {
				const name = userData.name ?? get().user.name;
				if (name) localStorage.setItem(STORAGE_KEYS.USER, name);
				else localStorage.removeItem(STORAGE_KEYS.USER);
			} catch (error) {
				if (import.meta.env.DEV) console.error("Error updating user in localStorage:", error);
			}
		},

		login: (userName) => {
			updateSlice(set, "user", { name: userName, isLoggedIn: true });
			try {
				localStorage.setItem(STORAGE_KEYS.USER, userName);
				updateSupabaseUserContext(userName);
			} catch (error) {
				if (import.meta.env.DEV) console.error("Error storing login in localStorage:", error);
			}
		},

		logout: () => {
			try {
				localStorage.removeItem(STORAGE_KEYS.USER);
				updateSupabaseUserContext(null);
			} catch (error) {
				if (import.meta.env.DEV) console.error("Error clearing login from localStorage:", error);
			}
			set((state) => ({
				user: { ...state.user, name: "", isLoggedIn: false, isAdmin: false },
				tournament: { ...state.tournament, names: null, isComplete: false, voteHistory: [] },
			}));
		},

		setAdminStatus: (isAdmin) => updateSlice(set, "user", { isAdmin }),

		setAvatar: (avatarUrl) => {
			updateSlice(set, "user", { avatarUrl });
			try {
				if (avatarUrl) localStorage.setItem(STORAGE_KEYS.USER_AVATAR, avatarUrl);
				else localStorage.removeItem(STORAGE_KEYS.USER_AVATAR);
			} catch (error) {
				if (import.meta.env.DEV) console.error("Error storing avatar in localStorage:", error);
			}
		},

		initializeFromStorage: () => {
			try {
				const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
				const storedAvatar = localStorage.getItem(STORAGE_KEYS.USER_AVATAR);
				const updates: Partial<UserState> = {};

				if (storedUser && get().user.name !== storedUser) {
					updateSupabaseUserContext(storedUser);
					updates.name = storedUser;
					updates.isLoggedIn = true;
				}
				if (storedAvatar && get().user.avatarUrl !== storedAvatar) {
					updates.avatarUrl = storedAvatar;
				}
				if (Object.keys(updates).length > 0) updateSlice(set, "user", updates);
			} catch (error) {
				if (import.meta.env.DEV) console.error("Error initializing from localStorage:", error);
			}
		},
	},

	uiActions: {
		setMatrixMode: (enabled) => updateSlice(set, "ui", { matrixMode: enabled }),
		setGlobalAnalytics: (show) => updateSlice(set, "ui", { showGlobalAnalytics: show }),
		setSwipeMode: (enabled) => updateSlice(set, "ui", { isSwipeMode: enabled }),
		setCatPictures: (show) => updateSlice(set, "ui", { showCatPictures: show }),
		setUserComparison: (show) => updateSlice(set, "ui", { showUserComparison: show }),
		setEditingProfile: (editing) => updateSlice(set, "ui", { isEditingProfile: editing }),

		setTheme: (newTheme) => {
			const isSystem = newTheme === "system";
			let resolvedTheme = newTheme;

			if (isSystem && typeof window !== "undefined" && window.matchMedia) {
				resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
			}

			updateSlice(set, "ui", { theme: resolvedTheme, themePreference: newTheme });

			if (typeof window !== "undefined") {
				localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
				if (isSystem) {
					const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
					const listener = (e: MediaQueryListEvent) => {
						if (get().ui.themePreference === "system") {
							updateSlice(set, "ui", { theme: e.matches ? "dark" : "light" });
						}
					};
					mediaQuery.addEventListener("change", listener);
				}
			}
		},

		initializeTheme: () => {
			if (typeof window !== "undefined") {
				const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
				get().uiActions.setTheme(storedTheme);
			}
		},
	},

	siteSettingsActions: {
		loadCatChosenName: async () => {
			try {
				const chosenNameData = (await siteSettingsAPI.getCatChosenName()) as CatChosenName | null;
				updateSlice(set, "siteSettings", { catChosenName: chosenNameData, isLoaded: true });
				return chosenNameData;
			} catch (error) {
				console.error("Error loading cat chosen name:", error);
				updateSlice(set, "siteSettings", { isLoaded: true });
				return null;
			}
		},

		updateCatChosenName: (nameData) =>
			updateSlice(set, "siteSettings", { catChosenName: nameData }),
	},
});

/* ==========================================================================
   ERROR SLICE
   ========================================================================== */

export const createErrorSlice: StateCreator<
	AppState,
	[],
	[],
	Pick<AppState, "errors" | "errorActions">
> = (set, _get) => ({
	errors: {
		current: null,
		history: [],
	},

	errorActions: {
		setError: (error) =>
			updateSlice(set, "errors", {
				current: error,
				history: error ? [..._get().errors.history, error] : _get().errors.history,
			}),

		clearError: () => updateSlice(set, "errors", { current: null }),

		logError: (error, context, metadata = {}) => {
			const errorLog = {
				error,
				context,
				metadata,
				timestamp: new Date().toISOString(),
			};

			updateSlice(set, "errors", {
				history: [..._get().errors.history, errorLog],
			});

			if (import.meta.env.DEV) {
				console.error("Error logged:", errorLog);
			}
		},
	},
});

/* ==========================================================================
   STORE CREATION & EXPORT
   ========================================================================== */

const useAppStore = create<AppState>()((...a) => ({
	...createTournamentSlice(...a),
	...createUserAndSettingsSlice(...a),
	...createErrorSlice(...a),

	// * Computed Selectors
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
		getSelectedNames: () => a[1]().tournament.selectedNames,
	},
}));

/**
 * Hook to initialize the store from localStorage on application mount.
 */
export const useAppStoreInitialization = () => {
	const { userActions } = useAppStore();

	useEffect(() => {
		userActions.initializeFromStorage();
	}, [userActions]);
};

export default useAppStore;
