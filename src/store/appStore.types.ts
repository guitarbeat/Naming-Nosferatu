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

export type { NameItem, RatingData };

export interface TournamentActions {
	setNames: (names: NameItem[] | null) => void;
	setRatings: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	setComplete: (isComplete: boolean) => void;
	resetTournament: () => void;
	setSelection: (names: NameItem[]) => void;
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
	setMatrixMode: (enabled: boolean) => void;
	setGlobalAnalytics: (show: boolean) => void;
	setSwipeMode: (enabled: boolean) => void;
	setCatPictures: (show: boolean) => void;
	setUserComparison: (show: boolean) => void;
	setEditingProfile: (editing: boolean) => void;
	setProfileOpen: (open: boolean) => void;
	setSuggestionOpen: (open: boolean) => void;
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
