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
    is_hidden?: boolean;
    rating?: number;
    wins?: number;
    losses?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
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
    currentRatings: Record<
        string,
        { rating: number; wins?: number; losses?: number }
    >;
    isTransitioning: boolean;
    isError: boolean;
    canUndo: boolean;
    sorter: unknown;
}

export interface TournamentActions {
    setRatings: (
        ratings: Record<string, { rating: number; wins?: number; losses?: number }>,
    ) => void;
    setComplete: (complete: boolean) => void;
    resetTournament: () => void;
    setLoading: (loading: boolean) => void;
    setNames: (names: NameItem[]) => void;
    setView: (view: string) => void;
}
