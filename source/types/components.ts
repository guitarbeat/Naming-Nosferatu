/**
 * @module components
 * @description Shared component data shapes and interfaces.
 * Consolidates types previously found in propTypes.ts.
 */

/**
 * Common ID type - can be string or number
 */
export type IdType = string | number;

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

export interface TournamentActions {
	setRatings: (ratings: Record<string, { rating: number; wins?: number; losses?: number }>) => void;
	setComplete: (complete: boolean) => void;
	resetTournament: () => void;
	setLoading: (loading: boolean) => void;
	setNames: (names: NameItem[]) => void;
	setView: (view: string) => void;
}

export interface BracketMatch {
	id: number;
	name1: string;
	name2?: string;
	winner?: number;
	round?: number;
	[key: string]: unknown;
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
