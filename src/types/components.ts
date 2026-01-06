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
	value?: IdType;
	description?: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	is_hidden?: boolean;
	rating?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	avg_rating?: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	popularity_score?: number;
	category?: string;
	wins?: number;
	losses?: number;
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

export interface TournamentState {
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
	existingRatings?: Record<string, number>;
	onComplete: (ratings: Record<string, number>) => void;
	userName?: string;
	onVote?: (voteData: VoteData) => Promise<void> | void;
}
