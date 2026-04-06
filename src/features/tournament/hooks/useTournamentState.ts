import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import {
        generateRandomTeams,
        resolveTournamentMode,
} from "@/features/tournament/services/tournament";
import { useWebSocket } from "@/features/websocket/hooks/useWebSocket";
import type { MatchResult, TournamentUpdate, UserActivity } from "@/features/websocket/services/websocketService";
import { useLocalStorage } from "@/shared/hooks";
import { ratingsAPI } from "@/shared/services/supabase/api";
import { TIMING } from "@/shared/lib/constants";
import type {
        Match,
        MatchRecord,
        NameItem,
        PersistentTournamentState,
        TournamentMode,
} from "@/shared/types";
import {
        calculateTournamentMetrics,
        computeUpdatedRatings,
        createIdToNameMap,
        createMatchRecord,
        createTeamsById,
        deriveBracketState,
        type HistoryEntry,
        resolveCurrentMatch,
} from "./tournamentEngine";
import {
        buildInitialRatings,
        createBracketEntrants,
        createDefaultPersistentState,
        createNamesKey,
        createTournamentId,
        sanitizePersistentState,
} from "./tournamentPersistence";
import { useAudioManager } from "./useHelpers";

interface UseTournamentStateResult {
        currentMatch: Match | null;
        ratings: Record<string, number>;
        round: number;
        totalRounds: number;
        bracketStage: string;
        matchNumber: number;
        totalMatches: number;
        isComplete: boolean;
        tournamentMode: TournamentMode;
        handleVote: (winnerId: string, loserId: string) => void;
        handleUndo: () => void;
        canUndo: boolean;
        handleQuit: () => void;
        progress: number;
        etaMinutes: number;
        isVoting: boolean;
        handleVoteWithAnimation: (winnerId: string, loserId: string) => void;
        matchHistory: MatchRecord[];
        subscribeToTournamentUpdates?: (tournamentId: string, callback: (update: TournamentUpdate) => void) => void;
        subscribeToMatchResults?: (callback: (result: MatchResult) => void) => void;
        subscribeToUserActivity?: (callback: (activity: UserActivity) => void) => void;
}

const VOTE_COOLDOWN = TIMING.VOTE_COOLDOWN_MS;

function haveSameIds(a: string[], b: string[]): boolean {
        if (a.length !== b.length) {
                return false;
        }
        const left = [...a].sort();
        const right = [...b].sort();
        return left.every((id, index) => id === right[index]);
}

export function useTournamentState(names: NameItem[], userName?: string): UseTournamentStateResult {
        const toast = useToast();
        const audioManager = useAudioManager();
        const [isVoting, setIsVoting] = useState(false);
        const [ratings, setRatings] = useState<Record<string, number>>({});
        const [history, setHistory] = useState<HistoryEntry[]>([]);
        const [refreshKey, setRefreshKey] = useState(0);
        const tournamentMode = useMemo(() => resolveTournamentMode(names.length), [names.length]);

        const namesKey = useMemo(() => createNamesKey(names), [names]);
        const tournamentId = useMemo(() => createTournamentId(names, userName), [names, userName]);

        const webSocket = useWebSocket({ autoConnect: true });

        const defaultPersistentState = useMemo(
                () => createDefaultPersistentState(userName || "anonymous"),
                [userName],
        );

        const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
                tournamentId,
                defaultPersistentState,
                {
                        debounceWait: 1000,
                        onError: () => {
                                toast.showWarning(
                                        "Your progress could not be saved locally. Voting will continue but may not persist after a page refresh.",
                                );
                        },
                },
        );

        const persistentState = useMemo(
                (): PersistentTournamentState =>
                        sanitizePersistentState(persistentStateRaw, userName || "anonymous"),
                [persistentStateRaw, userName],
        );

        const updatePersistentState = useCallback(
                (
                        updates:
                                | Partial<PersistentTournamentState>
                                | ((prev: PersistentTournamentState) => Partial<PersistentTournamentState>),
                ) => {
                        setPersistentState((prev) => {
                                const delta = typeof updates === "function" ? updates(prev) || {} : updates || {};
                                return { ...prev, ...delta };
                        });
                },
                [setPersistentState],
        );

        const ratingsRef = useRef(ratings);
        const initializedRef = useRef(false);
        const lastNamesKeyRef = useRef("");
        // Tracks when ratings were last updated in-memory (ms since epoch).
        // Used during initialization to avoid overwriting newer in-memory ratings
        // with a stale value read from localStorage (e.g. after a failed flush).
        const lastRatingsUpdateRef = useRef(0);

        // Cleanup WebSocket connections on unmount
        useEffect(() => {
                return () => {
                        if (webSocket && typeof webSocket.cleanup === "function") {
                                webSocket.cleanup();
                        }
                };
        }, [webSocket]);

        useEffect(() => {
                ratingsRef.current = ratings;
        }, [ratings]);

        useEffect(() => {
                const isNewNames = lastNamesKeyRef.current !== namesKey;
                if (isNewNames) {
                        initializedRef.current = false;
                        lastNamesKeyRef.current = namesKey;
                }

                if (initializedRef.current) {
                        return;
                }

                if (!Array.isArray(names) || names.length < 2) {
                        return;
                }

                // Batch all state updates to prevent race conditions
                const initializeTournament = () => {
                        const hasValidPersistence =
                                persistentState.namesKey === namesKey && persistentState.mode === tournamentMode;
                        const initialRatings = buildInitialRatings(names);

                        let teams = persistentState.teams;
                        if (tournamentMode === "2v2" && teams.length < 2) {
                                teams = generateRandomTeams(
                                        names.map((name) => ({ id: String(name.id), name: name.name })),
                                );
                        }

                        const participantIds =
                                tournamentMode === "2v2"
                                        ? teams.map((team) => team.id)
                                        : names.map((name) => String(name.id));
                        const shouldResetBracket =
                                !hasValidPersistence ||
                                persistentState.bracketEntrants.length === 0 ||
                                !haveSameIds(
                                        persistentState.bracketEntrants.filter((id) => !id.startsWith("__BYE__")),
                                        participantIds,
                                );
                        const bracketEntrants = shouldResetBracket
                                ? createBracketEntrants(participantIds)
                                : persistentState.bracketEntrants;

                        // Single state update to prevent race conditions
                        const stateUpdates: Partial<PersistentTournamentState> = {
                                matchHistory: shouldResetBracket ? [] : persistentState.matchHistory,
                                currentRound: shouldResetBracket ? 1 : persistentState.currentRound,
                                currentMatch: shouldResetBracket ? 1 : persistentState.currentMatch,
                                totalMatches: Math.max(0, participantIds.length - 1),
                                teams,
                                bracketEntrants,
                        };

                        if (!hasValidPersistence) {
                                Object.assign(stateUpdates, {
                                        namesKey,
                                        ratings: initialRatings,
                                        mode: tournamentMode,
                                        teamMatches: [],
                                        teamMatchIndex: 0,
                                });
                        } else if (
                                shouldResetBracket ||
                                (tournamentMode === "2v2" && teams !== persistentState.teams)
                        ) {
                                stateUpdates.ratings = shouldResetBracket ? initialRatings : persistentState.ratings;
                        }

                        // Update ratings and persistent state atomically.
                        // Guard: only restore ratings from storage if the stored timestamp is
                        // at least as recent as the last in-memory update. This prevents a
                        // stale localStorage value (e.g. from a failed unmount flush) from
                        // silently overwriting newer in-memory ratings on remount.
                        const storedRatingsAreFresh =
                                (persistentState.lastUpdated ?? 0) >= lastRatingsUpdateRef.current;
                        if (
                                hasValidPersistence &&
                                persistentState.ratings &&
                                Object.keys(persistentState.ratings).length > 0 &&
                                storedRatingsAreFresh
                        ) {
                                setRatings(persistentState.ratings);
                        } else if (lastRatingsUpdateRef.current > 0) {
                                // In-memory ratings are newer — keep ratingsRef.current as-is
                                setRatings(ratingsRef.current);
                        } else {
                                setRatings(initialRatings);
                                if (!stateUpdates.ratings) {
                                        stateUpdates.ratings = initialRatings;
                                }
                        }

                        updatePersistentState(stateUpdates);
                        initializedRef.current = true;
                        setRefreshKey((k) => k + 1);
                };

                // Use requestAnimationFrame to ensure smooth initialization
                requestAnimationFrame(initializeTournament);
        }, [
                namesKey,
                names.length,
                tournamentMode,
                persistentState.bracketEntrants,
                persistentState.currentRound,
                persistentState.matchHistory,
                persistentState.mode,
                persistentState.namesKey,
                persistentState.ratings,
                persistentState.teams,
                persistentState.currentMatch,
                updatePersistentState,
                names,
        ]);

        const idToNameMap = useMemo(() => createIdToNameMap(names), [names]);
        const teamsById = useMemo(() => createTeamsById(persistentState.teams), [persistentState.teams]);
        const bracketDerived = useMemo(
                () => deriveBracketState(persistentState.bracketEntrants, persistentState.matchHistory),
                [persistentState.bracketEntrants, persistentState.matchHistory],
        );

        const currentMatch = useMemo(() => {
                void refreshKey;
                return resolveCurrentMatch({
                        tournamentMode,
                        pendingMatchIds: bracketDerived.pendingMatchIds,
                        teamsById,
                        idToNameMap,
                });
        }, [refreshKey, idToNameMap, tournamentMode, bracketDerived.pendingMatchIds, teamsById]);

        const isComplete = bracketDerived.isComplete;
        const metrics = useMemo(
                () =>
                        calculateTournamentMetrics({
                                derived: bracketDerived,
                        }),
                [bracketDerived],
        );
        const { totalMatches, matchNumber, round, totalRounds, stageLabel, progress, etaMinutes } =
                metrics;

        const handleVote = useCallback(
                (winnerId: string, loserId: string) => {
                        if (!currentMatch) {
                                return;
                        }

                        const ratingsSnapshot = ratingsRef.current;
                        const newRatings = computeUpdatedRatings({
                                currentMatch,
                                ratingsSnapshot,
                                winnerId,
                                loserId,
                        });

                        const voteTimestamp = Date.now();
                        lastRatingsUpdateRef.current = voteTimestamp;
                        setRatings(newRatings);

                        // Fire-and-forget: update global win/loss counters per match.
                        // Errors are non-fatal — the local Elo update already happened.
                        const leftIds =
                                currentMatch.mode === "2v2"
                                        ? currentMatch.left.memberIds
                                        : [String(currentMatch.left.id)];
                        const rightIds =
                                currentMatch.mode === "2v2"
                                        ? currentMatch.right.memberIds
                                        : [String(currentMatch.right.id)];
                        const winnerSide = leftIds.includes(winnerId) ? "left" : "right";
                        ratingsAPI
                                .applyTournamentMatch({
                                        userName: userName ?? "anonymous",
                                        leftNameIds: leftIds,
                                        rightNameIds: rightIds,
                                        winnerSide,
                                })
                                .catch((err: unknown) => {
                                        console.warn("[tournament] apply_tournament_match_elo failed (non-fatal):", err);
                                });

                        const matchRecord: MatchRecord = createMatchRecord({
                                currentMatch,
                                winnerId,
                                loserId,
                                matchNumber,
                                round,
                        });

                        setHistory((prev) => [
                                ...prev,
                                {
                                        match: currentMatch,
                                        ratings: { ...ratingsSnapshot },
                                        round,
                                        matchNumber,
                                },
                        ]);

                        updatePersistentState((prev) => ({
                                matchHistory: [...(prev.matchHistory || []), matchRecord],
                                currentMatch: matchNumber + 1,
                                currentRound: round,
                                ratings: newRatings,
                                lastUpdated: voteTimestamp,
                        }));

                        setRefreshKey((k) => k + 1);
                },
                [currentMatch, matchNumber, round, updatePersistentState, userName],
        );

        const voteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

        const handleVoteWithAnimation = useCallback(
                (winnerId: string, loserId: string) => {
                        if (isVoting) {
                                return;
                        }
                        setIsVoting(true);
                        audioManager.playVoteSound();
                        voteTimeoutRef.current = setTimeout(() => {
                                handleVote(winnerId, loserId);
                                setIsVoting(false);
                        }, VOTE_COOLDOWN);
                },
                [handleVote, isVoting, audioManager],
        );

        // Cleanup vote timeout on unmount
        useEffect(() => {
                return () => {
                        if (voteTimeoutRef.current) {
                                clearTimeout(voteTimeoutRef.current);
                        }
                };
        }, []);

        const handleUndo = useCallback(() => {
                if (history.length === 0) {
                        toast.showWarning("No more moves to undo");
                        return;
                }

                const lastEntry = history[history.length - 1];
                if (!lastEntry) {
                        return;
                }

                audioManager.playUndoSound();
                setRatings(lastEntry.ratings);
                setHistory((prev) => prev.slice(0, -1));
                setRefreshKey((k) => k + 1);

                updatePersistentState((prev) => {
                        const newHistory = (prev.matchHistory || []).slice(0, -1);
                        return {
                                matchHistory: newHistory,
                                ratings: lastEntry.ratings,
                        };
                });
        }, [audioManager, history, toast, updatePersistentState]);

        const handleQuit = useCallback(() => {
                updatePersistentState({
                        matchHistory: [],
                        currentRound: 1,
                        currentMatch: 1,
                        totalMatches: 0,
                        namesKey: "",
                        ratings: {},
                        mode: "1v1",
                        teams: [],
                        teamMatches: [],
                        teamMatchIndex: 0,
                        bracketEntrants: [],
                });
                setHistory([]);
                setRatings({});
                setRefreshKey((key) => key + 1);
        }, [updatePersistentState]);

        return {
                currentMatch,
                ratings,
                round,
                totalRounds,
                bracketStage: stageLabel,
                matchNumber,
                totalMatches,
                isComplete,
                tournamentMode,
                handleVote,
                handleUndo,
                canUndo: history.length > 0,
                handleQuit,
                progress,
                etaMinutes,
                isVoting,
                handleVoteWithAnimation,
                matchHistory: persistentState.matchHistory,
                subscribeToTournamentUpdates: webSocket.subscribeToTournament,
                subscribeToMatchResults: webSocket.subscribeToMatches,
                subscribeToUserActivity: webSocket.subscribeToUserActivity,
        };
}
