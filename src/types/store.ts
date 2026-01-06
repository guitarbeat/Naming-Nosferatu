export interface UserState {
	name: string;
	isLoggedIn: boolean;
	isAdmin: boolean;
	preferences: Record<string, unknown>;
}

export interface TournamentName {
	id: string | number;
	name: string;
	description?: string;
	rating?: number;
	wins?: number;
	losses?: number;
}

interface TournamentState {
	names: TournamentName[] | null;
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: unknown[];
	currentView: string;
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

interface SiteSettingsState {
	catChosenName: unknown;
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
		setNames: (names: TournamentName[] | null) => void;
		setRatings: (
			ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
		) => void;
		setComplete: (isComplete: boolean) => void;
		setLoading: (isLoading: boolean) => void;
		addVote: (vote: unknown) => void;
		resetTournament: () => void;
		setView: (view: string) => void;
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
		loadCatChosenName: () => Promise<unknown>;
		updateCatChosenName: (nameData: unknown) => void;
	};

	selectors: {
		getTournamentNames: () => TournamentName[] | null;
		getRatings: () => Record<string, { rating: number; wins?: number; losses?: number }>;
		getIsComplete: () => boolean;
		getIsLoading: () => boolean;
		getVoteHistory: () => unknown[];
		getCurrentView: () => string;
		getUserName: () => string;
		getIsLoggedIn: () => boolean;
		getIsAdmin: () => boolean;
		getTheme: () => string;
		getCurrentError: () => Error | null;
	};
}
