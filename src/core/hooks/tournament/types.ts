export interface Name {
  id: string;
  name: string;
  description?: string;
  is_hidden?: boolean;
  rating?: number;
  wins?: number;
  losses?: number;
  [key: string]: unknown;
}

export interface Match {
  left: Name | string;
  right: Name | string;
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
  setNames: (names: Name[]) => void;
  setView: (view: string) => void;
}
