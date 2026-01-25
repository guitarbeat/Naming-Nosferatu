/**
 * @module types
 * @description Consolidated type definitions for the application.
 * Combines component types and store types into a single source of truth.
 */

/* ==========================================================================
   COMMON TYPES
   ========================================================================== */

/**
 * Common ID type - can be string or number
 */
export type IdType = string | number;

/* ==========================================================================
   COMPONENT TYPES (from components.ts)
   ========================================================================== */

export interface TournamentFilters {
	searchTerm?: string;
	category?: string;
	sortBy?: string;
	filterStatus?: "all" | "visible" | "hidden";
	userFilter?: string;
	selectionFilter?: string;
	sortOrder?: "asc" | "desc";
	dateFilter?: string;
}

/**
 * Name item interface
 */
export interface NameItem {
	id: IdType;
	name: string;
	description?: string;
	// View state
	isHidden?: boolean;
	isSelected?: boolean;
	avgRating?: number;
	// Database fields (compatibility)
	is_hidden?: boolean;
	avg_rating?: number;
	// Ratings & Stats
	wins?: number;
	losses?: number;
	popularity_score?: number;
	// Lifecycle & Provenance
	status?: "candidate" | "intake" | "tournament" | "eliminated" | "archived";
	provenance?: Array<{
		action: string;
		timestamp: string;
		userId?: string;
		details?: Record<string, unknown>;
	}>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: unknown;
}

export interface Match {
	left: NameItem | string;
	right: NameItem | string;
}

export interface MatchRecord {
	match: Match;
	winner: string | null;
	loser: string | null;
	voteType: string;
	matchNumber: number;
	roundNumber: number;
	timestamp: number;
}

export interface PersistentState {
	matchHistory: MatchRecord[];
	currentRound: number;
	currentMatch: number;
	totalMatches: number;
	userName: string;
	lastUpdated: number;
	namesKey: string;
}

export interface TournamentUIState {
	currentMatch: Match | null;
	currentMatchNumber: number;
	roundNumber: number;
	totalMatches: number;
	currentRatings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isTransitioning: boolean;
	isError: boolean;
	canUndo: boolean;
	sorter: unknown;
}

export interface VoteData {
	match: {
		left: {
			name: string;
			id: string | number | null;
			description: string;
			outcome: string;
		};
		right: {
			name: string;
			id: string | number | null;
			description: string;
			outcome: string;
		};
	};
	result: number;
	ratings: Record<string, number>;
	timestamp: string;
}

export interface TournamentProps {
	names: NameItem[];
	existingRatings?: Record<string, number | { rating: number; wins?: number; losses?: number }>;
	onComplete: (ratings: Record<string, { rating: number; wins?: number; losses?: number }>) => void;
	userName?: string;
	onVote?: (voteData: VoteData) => Promise<void> | void;
}

/* ==========================================================================
   STORE TYPES (from store.ts)
   ========================================================================== */

/**
 * User bubble profile for floating bubbles display
 */
export interface UserBubbleProfile {
	username: string;
	display_name?: string;
	avatar_url?: string;
}

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
	avatarUrl?: string;
	preferences: UserPreferences;
}

interface TournamentState {
	names: NameItem[] | null;
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: VoteData[];
	selectedNames: NameItem[];
}

export interface UIState {
	theme: string;
	themePreference: string;
	showGlobalAnalytics: boolean;
	showUserComparison: boolean;
	matrixMode: boolean;
	isSwipeMode: boolean;
	showCatPictures: boolean;
	isEditingProfile: boolean;
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
			ratingsOrFn:
				| Record<string, { rating: number; wins?: number; losses?: number }>
				| ((
						prev: Record<string, { rating: number; wins?: number; losses?: number }>,
				  ) => Record<string, { rating: number; wins?: number; losses?: number }>),
		) => void;
		setComplete: (isComplete: boolean) => void;
		setLoading: (isLoading: boolean) => void;
		addVote: (vote: VoteData) => void;
		resetTournament: () => void;
		setSelection: (selectedNames: NameItem[]) => void;
	};

	userActions: {
		setUser: (userData: Partial<UserState>) => void;
		login: (userName: string) => void;
		logout: () => void;
		setAdminStatus: (isAdmin: boolean) => void;
		setAvatar: (url: string) => void;
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
		setEditingProfile: (editing: boolean) => void;
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
		getVoteHistory: () => VoteData[];
		getUserName: () => string;
		getIsLoggedIn: () => boolean;
		getIsAdmin: () => boolean;
		getTheme: () => string;
		getCurrentError: () => Error | null;
		getSelectedNames: () => NameItem[];
	};
}
