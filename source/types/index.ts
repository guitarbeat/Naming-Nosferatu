/**
 * @module types
 * @description Consolidated type definitions for the application.
 * Combines component types and store types into a single source of truth.
 */

/* ==========================================================================
   CORE DATA TYPES
   ========================================================================== */

/** Common ID type - can be string or number */
export type IdType = string | number;

/**
 * Name item interface - The fundamental data unit of the app
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

/* ==========================================================================
   TOURNAMENT FEATURE TYPES
   ========================================================================== */

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

export interface VoteData {
	match: {
		left: VoteParticipant;
		right: VoteParticipant;
	};
	result: number;
	ratings: Record<string, number>;
	timestamp: string;
}

interface VoteParticipant {
	name: string;
	id: IdType | null;
	description: string;
	outcome: string;
}

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

export interface TournamentProps {
	names: NameItem[];
	existingRatings?: Record<string, number | { rating: number; wins?: number; losses?: number }>;
	onComplete: (ratings: Record<string, { rating: number; wins?: number; losses?: number }>) => void;
	userName?: string;
	onVote?: (voteData: VoteData) => Promise<void> | void;
}

/* ==========================================================================
   UI & VIEW MANAGEMENT TYPES
   ========================================================================== */

/** Extension points for customizing NameManagementView behavior */
export interface NameManagementViewExtensions {
	header?: React.ReactNode | (() => React.ReactNode);
	dashboard?: React.ReactNode | (() => React.ReactNode) | React.ComponentType;
	bulkActions?: React.ComponentType<{ onExport?: () => void }>;
	contextLogic?: React.ReactNode | (() => React.ReactNode);
	nameGrid?: React.ReactNode;
	navbar?: React.ReactNode | (() => React.ReactNode);
}

export interface UseNameManagementViewProps {
	mode: "tournament" | "profile";
	userName?: string | null;
	profileProps?: Record<string, unknown>;
	tournamentProps?: Record<string, unknown>;
	analysisMode: boolean;
	setAnalysisMode: (mode: boolean) => void;
	extensions?: NameManagementViewExtensions;
}

export interface NameManagementViewProfileProps {
	showUserFilter?: boolean;
	selectionStats?: {
		total: number;
		selected: number;
		visible: number;
		hidden: number;
	};
	userOptions?: Array<{ value: string; label: string }>;
	isAdmin?: boolean;
	onToggleVisibility?: (nameId: string) => Promise<void>;
	onDelete?: (name: NameItem) => Promise<void>;
}

export interface UseNameManagementViewResult {
	// Core data
	names: NameItem[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	dataError: Error | null;
	refetch: () => Promise<unknown>;
	clearErrors: () => void;
	setNames: (updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => void;
	setHiddenIds: (ids: Set<string | number>) => void;

	// Selection state
	selectedNames: NameItem[];
	selectedIds: unknown;
	isSelectionMode: boolean;
	setIsSelectionMode: () => void;
	toggleName: (nameOrId: NameItem | string) => void;
	toggleNameById: (nameId: string, selected: boolean) => void;
	toggleNamesByIds: (nameIds: string[], shouldSelect?: boolean) => void;
	clearSelection: () => void;
	selectAll: () => void;
	isSelected: (item: NameItem) => boolean;
	selectedCount: number;

	// Filtering and sorting
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filterStatus: string;
	setFilterStatus: (status: string) => void;
	sortBy: string;
	setSortBy: (sortBy: string) => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (order: "asc" | "desc") => void;

	showSelectedOnly: boolean;
	setShowSelectedOnly: (show: boolean) => void;
	selectionFilter: string;
	setSelectionFilter: React.Dispatch<React.SetStateAction<"all" | "selected" | "unselected">>;
	userFilter: string;
	setUserFilter: (filter: "all" | "user" | "other") => void;
	dateFilter: "all" | "today" | "week" | "month";
	setDateFilter: (filter: "all" | "today" | "week" | "month") => void;

	// UI state
	isSwipeMode: boolean;
	showCatPictures: boolean;
	activeTab: string;
	setActiveTab: (tab: string) => void;
	analysisMode: boolean;
	setAnalysisMode: (mode: boolean) => void;

	// Computed values
	sortedNames: NameItem[];
	filteredNames: NameItem[];
	filteredNamesForSwipe: NameItem[];

	stats: {
		total: number;
		visible: number;
		hidden: number;
		selected: number;
	};
	filterConfig: TournamentFilters;
	handleFilterChange: (name: keyof TournamentFilters, value: string | number | boolean) => void;
	handleAnalysisModeToggle: () => void;

	profileProps: {
		showUserFilter?: boolean;
		selectionStats?: unknown;
		userOptions?: Array<{ value: string; label: string }>;
		isAdmin?: boolean;
		[key: string]: unknown;
	};
	tournamentProps: Record<string, unknown>;

	// Extensions
	extensions: NameManagementViewExtensions;
}

/* ==========================================================================
   STORE TYPES (Application State)
   ========================================================================== */

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

export interface UserBubbleProfile {
	username: string;
	display_name?: string;
	avatar_url?: string;
}

interface TournamentState {
	names: NameItem[] | null;
	ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
	isComplete: boolean;
	isLoading: boolean;
	voteHistory: VoteData[];
	selectedNames: NameItem[];
}

interface SiteSettingsState {
	catChosenName: CatChosenName | null;
	isLoaded: boolean;
}

interface ErrorState {
	current: Error | null;
	history: unknown[];
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

/**
 * Main Application State Interface
 */
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
