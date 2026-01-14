import type { NameItem } from "./components";

export interface UserPreferences {
	theme?: string;
	notifications?: boolean;
	showCatPictures?: boolean;
	matrixMode?: boolean;
}

export interface UserState {
	name: string;
	isLoggedIn: boolean;
	isAdmin: boolean;
	preferences: UserPreferences;
}

interface TournamentState {
	names: NameItem[] | null;
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: import("./components").VoteData[];
}

export interface UIState {
	theme: string;
	themePreference: string;
	showGlobalAnalytics: boolean;
	showUserComparison: boolean;
	matrixMode: boolean;
	isSwipeMode: boolean;
	showCatPictures: boolean;
}

export interface CatChosenName {
	first_name: string;
	middle_names: string[];
	last_name: string;
	greeting_text: string;
	display_name: string;
	is_set: boolean;
	show_banner: boolean;
}

interface SiteSettingsState {
	catChosenName: CatChosenName | null;
	isLoaded: boolean;
}

interface ErrorState {
	current: Error | null;
	history: unknown[];
}

export interface AppState {
	tournament: TournamentState;
	user: UserState;
	ui: UIState;
	siteSettings: SiteSettingsState;
	errors: ErrorState;

	tournamentActions: {
		setNames: (names: NameItem[] | null) => void;
		setRatings: (
			ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
		) => void;
		setComplete: (isComplete: boolean) => void;
		setLoading: (isLoading: boolean) => void;
		addVote: (vote: import("./components").VoteData) => void;
		resetTournament: () => void;
	};

	userActions: {
		setUser: (userData: Partial<UserState>) => void;
		login: (userName: string) => void;
		logout: () => void;
		setAdminStatus: (isAdmin: boolean) => void;
		initializeFromStorage: () => void;
	};

	uiActions: {
		setMatrixMode: (enabled: boolean) => void;
		setGlobalAnalytics: (show: boolean) => void;
		setUserComparison: (show: boolean) => void;
		setTheme: (newTheme: string) => void;
		initializeTheme: () => void;
		setSwipeMode: (enabled: boolean) => void;
		setCatPictures: (show: boolean) => void;
	};

	errorActions: {
		setError: (error: Error | null) => void;
		clearError: () => void;
		logError: (error: Error, context: string, metadata?: Record<string, unknown>) => void;
	};

	siteSettingsActions: {
		loadCatChosenName: () => Promise<CatChosenName | null>;
		updateCatChosenName: (nameData: CatChosenName | null) => void;
	};

	selectors: {
		getTournamentNames: () => NameItem[] | null;
		getRatings: () => Record<string, { rating: number; wins?: number; losses?: number }>;
		getIsComplete: () => boolean;
		getIsLoading: () => boolean;
		getVoteHistory: () => import("./components").VoteData[];
		getUserName: () => string;
		getIsLoggedIn: () => boolean;
		getIsAdmin: () => boolean;
		getTheme: () => string;
		getCurrentError: () => Error | null;
	};
}
