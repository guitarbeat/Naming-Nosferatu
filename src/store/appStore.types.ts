import type { StateCreator } from "zustand";
import type {
	CatChosenName,
	ErrorState,
	NameItem,
	RatingData,
	SiteSettingsState,
	ThemePreference,
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
