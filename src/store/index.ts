import { useEffect } from "react";
import type { StateCreator } from "zustand";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
	clearStoredTournamentFromIDB,
	clearStoredTournamentSnapshot,
	clearStoredUserSnapshot,
	getStoredTournamentFromIDB,
	readStoredTournamentSnapshot,
	readStoredUserSnapshot,
	removeStorageItem,
	type StoredTournamentSnapshot,
	saveStoredTournamentToIDB,
	setStorageString,
	writeStoredTournamentSnapshot,
	writeStoredUserSnapshot,
} from "@/lib/storage";
import { ErrorManager, getRandomCatImage, STORAGE_KEYS } from "@/lib/utils";
import type {
	CatChosenName,
	ErrorLog,
	ErrorState,
	NameItem,
	RatingData,
	SiteSettingsState,
	ThemePreference,
	TournamentState,
	UIState,
	UserState,
} from "@/types";

interface TournamentActions {
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
	undoVote: () => void;
	syncTournamentProgress: (progress: Partial<TournamentState>) => void;
	clearVoteHistory: () => void;
	replaceTournamentState: (snapshot: TournamentState) => void;
}

interface UserActions {
	setUser: (data: Partial<UserState>) => void;
	login: (userName: string, onContext?: (name: string) => void) => void;
	logout: (onContext?: (name: null) => void) => void;
	setAdminStatus: (isAdmin: boolean) => void;
	setAvatar: (avatarUrl: string | undefined) => void;
	initializeFromStorage: (onContext?: (name: string) => void) => void;
}

interface UIActions {
	setTheme: (theme: ThemePreference) => void;
	initializeTheme: () => void;
	setBootLoading: (loading: boolean) => void;
}

interface SiteSettingsActions {
	setCatChosenName: (data: CatChosenName | null) => void;
	markSettingsLoaded: () => void;
}

interface ErrorActions {
	setError: (error: unknown | null) => void;
	clearError: () => void;
	logError: (error: unknown, context: string, metadata?: Record<string, unknown>) => void;
}

interface AppState {
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

type AppSet = Parameters<StateCreator<AppState>>[0];
const IS_BROWSER = typeof window !== "undefined";

function patch<K extends keyof AppState>(set: AppSet, key: K, updates: Partial<AppState[K]>): void {
	set((state) => ({ ...state, [key]: { ...state[key], ...updates } }));
}

function hydrateStoredTournament(
	base: TournamentState,
	stored: StoredTournamentSnapshot | null,
): TournamentState {
	if (!stored) {
		return base;
	}
	const matchHistory = Array.isArray(stored.matchHistory) ? stored.matchHistory : undefined;
	const hasCompletedMatches = Boolean(matchHistory && matchHistory.length > 0);
	return {
		...base,
		names: stored.names ?? null,
		ratings: stored.ratings ?? {},
		isComplete: Boolean(stored.isComplete) && hasCompletedMatches,
		voteHistory: Array.isArray(stored.voteHistory) ? stored.voteHistory : [],
		selectedNames: Array.isArray(stored.selectedNames) ? stored.selectedNames : [],
		matchHistory,
		currentRound: typeof stored.currentRound === "number" ? stored.currentRound : undefined,
		currentMatch: typeof stored.currentMatch === "number" ? stored.currentMatch : undefined,
		totalMatches: typeof stored.totalMatches === "number" ? stored.totalMatches : undefined,
		mode: stored.mode,
		teams: stored.teams,
		bracketEntrants: stored.bracketEntrants,
		lastUpdated: stored.lastUpdated,
	};
}

function persistTournamentState(t: TournamentState): void {
	if (!IS_BROWSER) {
		return;
	}
	if (
		!t.names &&
		(!t.selectedNames || t.selectedNames.length === 0) &&
		(!t.ratings || Object.keys(t.ratings).length === 0) &&
		(!t.voteHistory || t.voteHistory.length === 0) &&
		(!t.matchHistory || t.matchHistory.length === 0)
	) {
		clearStoredTournamentSnapshot();
		void clearStoredTournamentFromIDB();
		return;
	}
	const snapshot: StoredTournamentSnapshot = {
		names: t.names,
		ratings: t.ratings,
		isComplete: t.isComplete,
		voteHistory: t.voteHistory,
		selectedNames: t.selectedNames,
		matchHistory: t.matchHistory,
		currentRound: t.currentRound,
		currentMatch: t.currentMatch,
		totalMatches: t.totalMatches,
		mode: t.mode,
		teams: t.teams,
		bracketEntrants: t.bracketEntrants,
		lastUpdated: Date.now(),
	};
	writeStoredTournamentSnapshot(snapshot);
	void saveStoredTournamentToIDB(snapshot);
}

function updateTournament(set: AppSet, get: () => AppState, updates: Partial<TournamentState>) {
	patch(set, "tournament", updates);
	persistTournamentState({ ...get().tournament, ...updates });
}

const useAppStore = create<AppState>()((set, get) => ({
	tournament: IS_BROWSER
		? hydrateStoredTournament(
				{
					names: null,
					ratings: {},
					isComplete: false,
					isLoading: false,
					voteHistory: [],
					selectedNames: [],
				},
				readStoredTournamentSnapshot(),
			)
		: {
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
						rating: ratingVal ?? name.rating ?? name.avgRating ?? name.avg_rating ?? 1500,
					};
				}) ?? null;
			updateTournament(set, get, {
				names: processedNames,
				isComplete: false,
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				bracketEntrants: [],
				voteHistory: [],
			});
		},
		setRatings: (ratingsOrFn) => {
			const current = get().tournament.ratings;
			const nextRatings = typeof ratingsOrFn === "function" ? ratingsOrFn(current) : ratingsOrFn;
			updateTournament(set, get, { ratings: { ...current, ...nextRatings } });
		},
		setComplete: (isComplete) => updateTournament(set, get, { isComplete }),
		completeTournament: (ratings) =>
			updateTournament(set, get, {
				ratings: { ...get().tournament.ratings, ...ratings },
				isComplete: true,
			}),
		resetTournament: () =>
			updateTournament(set, get, {
				names: null,
				isComplete: false,
				voteHistory: [],
				matchHistory: [],
				currentRound: 1,
				currentMatch: 1,
				bracketEntrants: [],
				ratings: {},
			}),
		setSelection: (selectedNames) => updateTournament(set, get, { selectedNames }),
		recordVote: (winnerId, loserId, winnerMemberIds, loserMemberIds) => {
			const voteHistory = [
				...get().tournament.voteHistory,
				{
					winnerId,
					loserId,
					timestamp: Date.now(),
					...(winnerMemberIds ? { winnerMemberIds } : {}),
					...(loserMemberIds ? { loserMemberIds } : {}),
				},
			];
			updateTournament(set, get, { voteHistory });
		},
		undoVote: () => {
			const prevMatch = get().tournament.matchHistory;
			updateTournament(set, get, {
				voteHistory: get().tournament.voteHistory.slice(0, -1),
				matchHistory: prevMatch ? prevMatch.slice(0, -1) : undefined,
			});
		},
		syncTournamentProgress: (progressUpdates) => {
			const current = get().tournament;
			const ratings = progressUpdates.ratings
				? { ...current.ratings, ...progressUpdates.ratings }
				: current.ratings;
			updateTournament(set, get, { ...progressUpdates, ratings, lastUpdated: Date.now() });
		},
		clearVoteHistory: () => updateTournament(set, get, { voteHistory: [] }),
		replaceTournamentState: (snapshot: TournamentState) => {
			set({ tournament: { ...snapshot } });
			persistTournamentState(snapshot);
		},
	},
	user: (() => {
		const base: UserState = {
			id: null,
			name: "",
			isLoggedIn: false,
			isAdmin: false,
			preferences: {},
		};
		const stored = IS_BROWSER ? readStoredUserSnapshot() : null;
		return stored
			? {
					...base,
					id: stored.id ?? null,
					name: stored.name,
					isLoggedIn: true,
					isAdmin: Boolean(stored.isAdmin),
					avatarUrl: stored.avatarUrl,
				}
			: base;
	})(),
	userActions: {
		setUser: (data) => {
			const nextUser = { ...get().user, ...data };
			patch(set, "user", data);
			if (nextUser.name.trim()) {
				writeStoredUserSnapshot(nextUser);
			} else {
				clearStoredUserSnapshot();
			}
		},
		login: (userName, onContext) => {
			const id = `user_${crypto.randomUUID()}`;
			const nextUser = {
				...get().user,
				id,
				name: userName,
				isLoggedIn: true,
				isAdmin: false,
				avatarUrl: getRandomCatImage(id, undefined, userName),
			};
			patch(set, "user", nextUser);
			writeStoredUserSnapshot(nextUser);
			onContext?.(userName);
		},
		logout: (onContext) => {
			clearStoredUserSnapshot();
			clearStoredTournamentSnapshot();
			onContext?.(null);
			set((state) => ({
				...state,
				user: { ...state.user, name: "", isLoggedIn: false, isAdmin: false },
				tournament: { ...state.tournament, names: null, isComplete: false, voteHistory: [] },
			}));
		},
		setAdminStatus: (isAdmin) => {
			const nextUser = { ...get().user, isAdmin };
			patch(set, "user", { isAdmin });
			writeStoredUserSnapshot(nextUser);
		},
		setAvatar: (avatarUrl) => {
			const nextUser = { ...get().user, avatarUrl };
			patch(set, "user", { avatarUrl });
			if (avatarUrl) {
				setStorageString(STORAGE_KEYS.USER_AVATAR, avatarUrl);
			} else {
				removeStorageItem(STORAGE_KEYS.USER_AVATAR);
			}
			writeStoredUserSnapshot(nextUser);
		},
		initializeFromStorage: (onContext) => {
			const stored = readStoredUserSnapshot();
			if (stored && get().user.name !== stored.name) {
				onContext?.(stored.name);
				patch(set, "user", {
					id: stored.id ?? null,
					name: stored.name,
					isLoggedIn: true,
					isAdmin: Boolean(stored.isAdmin),
					avatarUrl: stored.avatarUrl,
				});
			}
		},
	},
	ui: { theme: "dark", themePreference: "dark", isBootLoading: true },
	uiActions: {
		setTheme: () => {
			patch(set, "ui", { theme: "dark", themePreference: "dark" });
			if (IS_BROWSER) {
				setStorageString(STORAGE_KEYS.THEME, "dark");
				document.documentElement.dataset.theme = "dark";
				document.documentElement.classList.add("dark");
			}
		},
		initializeTheme: () => {
			if (!IS_BROWSER) {
				return;
			}
			setStorageString(STORAGE_KEYS.THEME, "dark");
			document.documentElement.dataset.theme = "dark";
			document.documentElement.classList.add("dark");
			patch(set, "ui", { theme: "dark", themePreference: "dark" });
		},
		setBootLoading: (loading) => patch(set, "ui", { isBootLoading: loading }),
	},
	siteSettings: { catChosenName: null, isLoaded: false },
	siteSettingsActions: {
		setCatChosenName: (data) => patch(set, "siteSettings", { catChosenName: data }),
		markSettingsLoaded: () => patch(set, "siteSettings", { isLoaded: true }),
	},
	errors: { current: null, history: [] },
	errorActions: {
		setError: (error) => {
			const log: ErrorLog | null = error
				? { error, context: "setError", metadata: {}, timestamp: new Date().toISOString() }
				: null;
			patch(set, "errors", {
				current: error,
				history: log ? [...get().errors.history, log].slice(-50) : get().errors.history,
			});
		},
		clearError: () => patch(set, "errors", { current: null }),
		logError: (error, context, metadata = {}) => {
			const entry: ErrorLog = { error, context, metadata, timestamp: new Date().toISOString() };
			patch(set, "errors", { history: [...get().errors.history, entry].slice(-50) });
			ErrorManager.handleError(error, context);
		},
	},
}));

export default useAppStore;

export function useAppStoreInitialization(onUserContext?: (name: string) => void): void {
	const initializeUser = useAppStore((s) => s.userActions.initializeFromStorage);
	const initializeTheme = useAppStore((s) => s.uiActions.initializeTheme);
	useEffect(() => {
		initializeUser(onUserContext);
		initializeTheme();
		if (!IS_BROWSER) {
			return;
		}
		void getStoredTournamentFromIDB()
			.then((stored) => {
				if (!stored) {
					return;
				}
				const current = useAppStore.getState().tournament;
				const isEmpty =
					!current.names &&
					(!current.selectedNames || current.selectedNames.length === 0) &&
					(!current.ratings || Object.keys(current.ratings).length === 0);
				if (
					isEmpty ||
					(stored.lastUpdated && (!current.lastUpdated || stored.lastUpdated > current.lastUpdated))
				) {
					useAppStore
						.getState()
						.tournamentActions.replaceTournamentState(hydrateStoredTournament(current, stored));
				}
			})
			.catch((err) => ErrorManager.handleError(err, "hydrateTournamentFromIndexedDB"));
	}, [initializeTheme, initializeUser, onUserContext]);
}

export function useActiveTournamentStatus() {
	return useAppStore(
		useShallow((s) => ({
			hasActiveTournament: Boolean(
				s.tournament.names && s.tournament.names.length >= 2 && !s.tournament.isComplete,
			),
			namesCount: s.tournament.names?.length ?? 0,
		})),
	);
}

export function useTournamentSetupState() {
	return useAppStore(
		useShallow((s) => ({
			names: s.tournament.names,
			isComplete: s.tournament.isComplete,
			ratings: s.tournament.ratings,
			userId: s.user.id,
			userName: s.user.name,
		})),
	);
}
