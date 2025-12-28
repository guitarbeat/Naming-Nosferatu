/**
 * @module propTypes
 * @description Shared PropTypes and TypeScript interfaces for common data shapes.
 * Centralizes types to ensure consistency across the application.
 */

import PropTypes from "prop-types";

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

// ts-prune-ignore-next (used in module - MatchRecord)
export interface Match {
    left: NameItem | string;
    right: NameItem | string;
}

// ts-prune-ignore-next (used in module - PersistentState)
export interface MatchRecord {
    match: Match;
    winner: string | null;
    loser: string | null;
    voteType: string;
    matchNumber: number;
    roundNumber: number;
    timestamp: number;
}

// ts-prune-ignore-next (used as type in tournament hooks)
export interface PersistentState {
    matchHistory: MatchRecord[];
    currentRound: number;
    currentMatch: number;
    totalMatches: number;
    userName: string;
    lastUpdated: number;
    namesKey: string;
}

// ts-prune-ignore-next (used as type in App, ViewRouter, and tournament hooks)
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

// ts-prune-ignore-next (used as type in tournament hooks)
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

/**
 * Common ID type - can be string or number
 */
const idType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

/**
 * Name item shape - used in rankings, highlights, charts
 */
export const nameItemShape = PropTypes.shape({
    id: idType,
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});
