import { useEffect } from "react";
import { create, type StateCreator } from "zustand";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import {
	clearStoredUserSnapshot,
	getStorageString,
	readStoredUserSnapshot,
	removeStorageItem,
	setStorageString,
	writeStoredUserSnapshot,
} from "@/shared/lib/storage";
import { ErrorManager } from "@/shared/services/errorManager";
import type {
	ErrorLog,
	ThemePreference,
	ThemeValue,
	TournamentState,
	UIState,
	UserState,
} from "@/shared/types";

export type AppSet = Parameters<StateCreator<AppState>>[0];
export type AppSliceCreator<TSlice> = StateCreator<AppState, [], [], TSlice>;

export const IS_BROWSER = typeof window !== "undefined";
export const IS_DEV = import.meta.env?.DEV ?? false;

export function patch<K extends keyof AppState>(
	set: AppSet,
	key: K,
	updates: Partial<AppState[K]>,
): void {
	set((state) => ({
		...state,
		[key]: { ...state[key], ...updates },
	}));
}

export interface TournamentActions {
	setNames: (names: NameItem[] | null) => void;
	setRatings: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	setComplete: (isComplete: boolean) => void;
	completeTournament: (ratings: Record<string, RatingData>) => void;
	resetTournament: () => void;
	setSelection: (names: NameItem[]) => void;
	recordVote: (
		winnerId: string,
		loserId: string,
		winnerMemberIds?: string[],
		loserMemberIds?: string[],
	) => void;
	clearVoteHistory: () => void;
	replaceTournamentState: (snapshot: TournamentState) => void;
}

export interface UserActions {
	setUser: (data: Partial<UserState>) => void;
	login: (userName: string, onContext?: (name: string) => void) => void;
	logout: (onContext?: (name: null) => void) => void;
	setAdminStatus: (isAdmin: boolean) => void;
	setAvatar: (avatarUrl: string | undefined) => void;
	initializeFromStorage: (onContext?: (name: string) => void) => void;
}

export interface UIActions {
	setTheme: (theme: ThemePreference) => void;
	initializeTheme: () => void;
	setBootLoading: (loading: boolean) => void;
}

export interface SiteSettingsActions {
	setCatChosenName: (data: CatChosenName | null) => void;
	markSettingsLoaded: () => void;
}

export interface ErrorActions {
	setError: (error: unknown | null) => void;
	clearError: () => void;
	logError: (error: unknown, context: string, metadata?: Record<string, unknown>) => void;
}

export interface AppState {
	tournament: TournamentState;
	tournamentActions: TournamentActions;

	user: UserState;
	userActions: UserActions;

	ui: UIState;
	uiActions: UIActions;

	siteSettings: SiteSettingsState;
	siteSettingsActions: SiteSettingsActions;

	errors: ErrorState;
	errorActions: ErrorActions;
}

const MAX_ERROR_HISTORY = 100;

export const createErrorSlice: AppSliceCreator<Pick<AppState, "errors" | "errorActions">> = (
	set,
	get,
) => ({
	errors: {
		current: null,
		history: [],
	},

	errorActions: {
		setError: (error) => {
			const log: ErrorLog | null = error
				? {
						error,
						context: "setError",
						metadata: {},
						timestamp: new Date().toISOString(),
					}
				: null;

			patch(set, "errors", {
				current: error,
				history: log
					? [...get().errors.history, log].slice(-MAX_ERROR_HISTORY)
					: get().errors.history,
			});
		},

		clearError: () => patch(set, "errors", { current: null }),

		logError: (error, context, metadata = {}) => {
			const entry: ErrorLog = {
				error,
				context,
				metadata,
				timestamp: new Date().toISOString(),
			};

			patch(set, "errors", {
				history: [...get().errors.history, entry].slice(-MAX_ERROR_HISTORY),
			});

			// Defer to ErrorManager for standardized logging
			ErrorManager.handleError(error, context, metadata);
		},
	},
});

export const createTournamentSlice: AppSliceCreator<
	Pick<AppState, "tournament" | "tournamentActions">
> = (set, get) => ({
	tournament: {
		names: null,
		ratings: {},
		isComplete: false,
		isLoading: false,
		voteHistory: [],
		selectedNames: [],
	},

	tournamentActions: {
		setNames: (names) => {
			const currentRatings = get().tournament.ratings;
			patch(set, "tournament", {
				names:
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
							rating: ratingVal ?? name.rating ?? name.avgRating ?? name.avg_rating ?? 1500,
						};
					}) ?? null,
			});
		},

		setRatings: (ratingsOrFn) => {
			const current = get().tournament.ratings;
			const next = typeof ratingsOrFn === "function" ? ratingsOrFn(current) : ratingsOrFn;
			patch(set, "tournament", { ratings: { ...current, ...next } });
		},

		setComplete: (isComplete) => patch(set, "tournament", { isComplete }),

		completeTournament: (ratings) => {
			const current = get().tournament.ratings;
			patch(set, "tournament", {
				ratings: { ...current, ...ratings },
				isComplete: true,
			});
		},

		resetTournament: () =>
			patch(set, "tournament", {
				names: null,
				isComplete: false,
				voteHistory: [],
			}),

		setSelection: (selectedNames) => patch(set, "tournament", { selectedNames }),

		recordVote: (winnerId, loserId, winnerMemberIds, loserMemberIds) => {
			const prev = get().tournament.voteHistory;
			patch(set, "tournament", {
				voteHistory: [
					...prev,
					{
						winnerId,
						loserId,
						timestamp: Date.now(),
						...(winnerMemberIds ? { winnerMemberIds } : {}),
						...(loserMemberIds ? { loserMemberIds } : {}),
					},
				],
			});
		},

		clearVoteHistory: () => patch(set, "tournament", { voteHistory: [] }),

		replaceTournamentState: (snapshot: TournamentState) => {
			set({ tournament: { ...snapshot } });
		},
	},
});

let systemThemeCleanup: (() => void) | null = null;

function getInitialUserState(): UserState {
	const base: UserState = {
		id: null,
		name: "",
		isLoggedIn: false,
		isAdmin: false,
		preferences: {},
	};

	if (!IS_BROWSER) {
		return base;
	}

	const storedSnapshot = readStoredUserSnapshot();
	if (!storedSnapshot) {
		return base;
	}

	return {
		...base,
		id: storedSnapshot.id ?? null,
		name: storedSnapshot.name,
		isLoggedIn: true,
		isAdmin: Boolean(storedSnapshot.isAdmin),
		avatarUrl: storedSnapshot.avatarUrl,
	};
}

function getInitialTheme(): Pick<UIState, "theme" | "themePreference"> {
	if (!IS_BROWSER) {
		return { theme: "dark", themePreference: "dark" };
	}

	const stored = getStorageString(STORAGE_KEYS.THEME);
	if (stored === "light" || stored === "dark" || stored === "system") {
		const resolved: ThemeValue =
			stored === "system"
				? window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light"
				: stored;

		return { theme: resolved, themePreference: stored };
	}

	return { theme: "dark", themePreference: "dark" };
}

function persistOptionalString(key: string, value: string | undefined): void {
	if (value) {
		setStorageString(key, value);
		return;
	}

	removeStorageItem(key);
}

function readThemePreferenceFromStorage(): ThemePreference {
	const stored = getStorageString(STORAGE_KEYS.THEME) ?? "dark";
	return ["light", "dark", "system"].includes(stored) ? (stored as ThemePreference) : "dark";
}

function persistUserState(user: UserState): void {
	if (!user.name.trim()) {
		clearStoredUserSnapshot();
		return;
	}

	writeStoredUserSnapshot({
		id: user.id,
		name: user.name,
		isAdmin: user.isAdmin,
		avatarUrl: user.avatarUrl,
	});
}

export const createUserAndSettingsSlice: AppSliceCreator<
	Pick<
		AppState,
		"user" | "userActions" | "ui" | "uiActions" | "siteSettings" | "siteSettingsActions"
	>
> = (set, get) => ({
	user: getInitialUserState(),

	userActions: {
		setUser: (data) => {
			const nextUser = { ...get().user, ...data };
			patch(set, "user", data);
			persistUserState(nextUser);
		},

		login: (userName, onContext) => {
			const id = `user_${Math.random().toString(36).substring(2, 9)}`;
			const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;
			const nextUser = {
				...get().user,
				id,
				name: userName,
				isLoggedIn: true,
				isAdmin: false,
				avatarUrl,
			};
			patch(set, "user", nextUser);
			persistUserState(nextUser);
			onContext?.(userName);
		},

		logout: (onContext) => {
			clearStoredUserSnapshot();
			onContext?.(null);
			set((state) => ({
				...state,
				user: { ...state.user, name: "", isLoggedIn: false, isAdmin: false },
				tournament: {
					...state.tournament,
					names: null,
					isComplete: false,
				},
			}));
		},

		setAdminStatus: (isAdmin) => {
			const nextUser = { ...get().user, isAdmin };
			patch(set, "user", { isAdmin });
			persistUserState(nextUser);
		},

		setAvatar: (avatarUrl) => {
			const nextUser = { ...get().user, avatarUrl };
			patch(set, "user", { avatarUrl });
			persistOptionalString(STORAGE_KEYS.USER_AVATAR, avatarUrl);
			persistUserState(nextUser);
		},

		initializeFromStorage: (onContext) => {
			const storedUser = readStoredUserSnapshot();
			const updates: Partial<UserState> = {};

			if (storedUser && get().user.name !== storedUser.name) {
				onContext?.(storedUser.name);
				updates.name = storedUser.name;
				updates.isLoggedIn = true;
			}

			if (storedUser?.id && get().user.id !== storedUser.id) {
				updates.id = storedUser.id;
			}

			if (storedUser && get().user.isAdmin !== Boolean(storedUser.isAdmin)) {
				updates.isAdmin = Boolean(storedUser.isAdmin);
			}

			if (storedUser?.avatarUrl && get().user.avatarUrl !== storedUser.avatarUrl) {
				updates.avatarUrl = storedUser.avatarUrl;
			}

			if (Object.keys(updates).length > 0) {
				patch(set, "user", updates);
			}
		},
	},

	ui: {
		...getInitialTheme(),
		isBootLoading: true,
	},

	uiActions: {
		setTheme: (preference) => {
			systemThemeCleanup?.();
			systemThemeCleanup = null;

			if (preference !== "system" || !IS_BROWSER) {
				const resolved = preference === "light" ? "light" : "dark";
				patch(set, "ui", { theme: resolved, themePreference: preference });
				setStorageString(STORAGE_KEYS.THEME, preference);
				return;
			}

			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			const resolved = mediaQuery.matches ? "dark" : "light";

			const handleChange = (event: MediaQueryListEvent) => {
				if (get().ui.themePreference === "system") {
					patch(set, "ui", { theme: event.matches ? "dark" : "light" });
				}
			};

			mediaQuery.addEventListener("change", handleChange);
			systemThemeCleanup = () => mediaQuery.removeEventListener("change", handleChange);

			patch(set, "ui", { theme: resolved, themePreference: preference });
			setStorageString(STORAGE_KEYS.THEME, preference);
		},

		initializeTheme: () => {
			if (!IS_BROWSER) {
				return;
			}

			get().uiActions.setTheme(readThemePreferenceFromStorage());
		},

		setBootLoading: (loading) => patch(set, "ui", { isBootLoading: loading }),
	},

	siteSettings: {
		catChosenName: null,
		isLoaded: false,
	},

	siteSettingsActions: {
		setCatChosenName: (data) => patch(set, "siteSettings", { catChosenName: data }),
		markSettingsLoaded: () => patch(set, "siteSettings", { isLoaded: true }),
	},
});

const useAppStore = create<AppState>()((...args) => ({
	...createTournamentSlice(...args),
	...createUserAndSettingsSlice(...args),
	...createErrorSlice(...args),
}));

export default useAppStore;

export function useAppStoreInitialization(onUserContext?: (name: string) => void): void {
	const initializeUser = useAppStore((state) => state.userActions.initializeFromStorage);
	const initializeTheme = useAppStore((state) => state.uiActions.initializeTheme);

	useEffect(() => {
		initializeUser(onUserContext);
		initializeTheme();
	}, [initializeTheme, initializeUser, onUserContext]);
}

export const errorContexts = {
	tournamentFlow: "Tournament Flow",
	analysisDashboard: "Analysis Dashboard",
	mainLayout: "Main Application Layout",
} as const;
