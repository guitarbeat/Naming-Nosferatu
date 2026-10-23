import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useToast } from "@/components/AppChrome";
import { useLocalStorage } from "@/hooks/useCommonHooks";
import { ratingsAPI } from "@/lib/api";
import { createSortedKey, ELO_RATING, shuffleArray, TIMING } from "@/lib/utils";
import useAppStore from "@/store";
import {
	calculateTournamentMetrics,
	computeUpdatedRatings,
	createIdToNameMap,
	createMatchRecord,
	createTeamsById,
	deriveBracketState,
	generateRandomTeams,
	type HistoryEntry,
	isBye,
	resolveCurrentMatch,
	resolveTournamentMode,
} from "@/tournament/tournamentEngine";
import type {
	Match,
	NameItem,
	PersistentTournamentState,
	RatingData,
	Team,
	TeamMatch,
	TournamentMode,
} from "@/types";

function createDefaultPersistentState(userName = "anonymous"): PersistentTournamentState {
	return {
		matchHistory: [],
		currentRound: 1,
		currentMatch: 1,
		totalMatches: 0,
		userName,
		lastUpdated: Date.now(),
		namesKey: "",
		ratings: {},
		mode: "1v1",
		teams: [],
		teamMatches: [],
		teamMatchIndex: 0,
		bracketEntrants: [],
	};
}

function sanitizePersistentState(raw: unknown, userName: string): PersistentTournamentState {
	const base = createDefaultPersistentState(userName);
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return base;
	}
	const m = { ...base, ...(raw as Record<string, unknown>) };
	return {
		...m,
		mode: m.mode === "2v2" ? "2v2" : "1v1",
		matchHistory: Array.isArray(m.matchHistory) ? m.matchHistory : [],
		ratings: m.ratings && typeof m.ratings === "object" ? m.ratings : {},
		namesKey: typeof m.namesKey === "string" ? m.namesKey : "",
		teams: Array.isArray(m.teams)
			? (m.teams as Team[]).filter(
					(t) =>
						t && typeof t.id === "string" && Array.isArray(t.memberIds) && t.memberIds.length === 2,
				)
			: [],
		teamMatches: Array.isArray(m.teamMatches) ? (m.teamMatches as TeamMatch[]) : [],
		teamMatchIndex: typeof m.teamMatchIndex === "number" ? Math.max(0, m.teamMatchIndex) : 0,
		bracketEntrants: Array.isArray(m.bracketEntrants) ? m.bracketEntrants.map(String) : [],
	} as PersistentTournamentState;
}

type TournamentAction =
	| {
			type: "INIT";
			payload: { ratings: Record<string, number>; persistentState: PersistentTournamentState };
	  }
	| {
			type: "VOTE";
			payload: {
				currentMatch: Match;
				winnerId: string;
				loserId: string;
				matchNumber: number;
				round: number;
				voteTimestamp: number;
			};
	  }
	| { type: "UNDO"; payload: { lastEntry: HistoryEntry } }
	| { type: "QUIT"; payload: { defaultState: PersistentTournamentState } };

interface TournamentReducerState {
	ratings: Record<string, number>;
	history: HistoryEntry[];
	persistentState: PersistentTournamentState;
	refreshKey: number;
}

function tournamentReducer(
	state: TournamentReducerState,
	action: TournamentAction,
): TournamentReducerState {
	if (action.type === "INIT") {
		return {
			ratings: action.payload.ratings,
			history: [],
			persistentState: action.payload.persistentState,
			refreshKey: state.refreshKey + 1,
		};
	}
	if (action.type === "VOTE") {
		const { currentMatch, winnerId, loserId, matchNumber, round, voteTimestamp } = action.payload;
		const newRatings = computeUpdatedRatings({
			currentMatch,
			ratingsSnapshot: state.ratings,
			winnerId,
		});
		const matchRecord = createMatchRecord({ currentMatch, winnerId, loserId, matchNumber, round });
		return {
			...state,
			ratings: newRatings,
			history: [
				...state.history,
				{ match: currentMatch, ratings: { ...state.ratings }, round, matchNumber },
			],
			persistentState: {
				...state.persistentState,
				matchHistory: [...(state.persistentState.matchHistory || []), matchRecord],
				currentMatch: matchNumber + 1,
				currentRound: round,
				ratings: newRatings,
				lastUpdated: voteTimestamp,
			},
			refreshKey: state.refreshKey + 1,
		};
	}
	if (action.type === "UNDO") {
		const { lastEntry } = action.payload;
		return {
			...state,
			ratings: lastEntry.ratings,
			history: state.history.slice(0, -1),
			persistentState: {
				...state.persistentState,
				matchHistory: (state.persistentState.matchHistory || []).slice(0, -1),
				ratings: lastEntry.ratings,
				currentMatch: lastEntry.matchNumber,
				currentRound: lastEntry.round,
			},
			refreshKey: state.refreshKey + 1,
		};
	}
	return {
		ratings: {},
		history: [],
		persistentState: action.payload.defaultState,
		refreshKey: state.refreshKey + 1,
	};
}

export function useTournamentState(names: NameItem[], userName?: string) {
	const toast = useToast();
	const [isVoting, setIsVoting] = useState(false);
	const userKey = userName || "anonymous";
	const tournamentMode = useMemo(() => resolveTournamentMode(names.length), [names.length]);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const namesKey = useMemo(() => createSortedKey(names.map((n) => n?.id || "")), [names]);

	const tournamentId = useMemo(() => {
		let hash = 0;
		for (let i = 0; i < namesKey.length; i++) {
			hash = ((hash << 5) - hash + namesKey.charCodeAt(i)) | 0;
		}
		return `tournament-${userKey}-${Math.abs(hash).toString(36)}-${names.length}`;
	}, [namesKey, userKey, names.length]);

	const defaultPersistentState = useMemo(() => createDefaultPersistentState(userKey), [userKey]);
	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
		tournamentId,
		defaultPersistentState,
		{ onError: () => toast.showWarning("Progress could not be saved locally.") },
	);

	const persistentState = useMemo(
		() => sanitizePersistentState(persistentStateRaw, userKey),
		[persistentStateRaw, userKey],
	);

	const [state, dispatch] = useReducer(tournamentReducer, {
		ratings: {},
		history: [],
		persistentState: defaultPersistentState,
		refreshKey: 0,
	});

	const initializedRef = useRef(false);
	const lastNamesKeyRef = useRef("");

	useEffect(() => {
		if (!initializedRef.current) {
			return;
		}
		setPersistentState(state.persistentState);
		const ratingsData: Record<string, RatingData> = {};
		for (const id of Object.keys(state.ratings)) {
			ratingsData[id] = { rating: state.ratings[id], wins: 0, losses: 0 };
		}
		tournamentActions.syncTournamentProgress({
			ratings: ratingsData,
			matchHistory: state.persistentState.matchHistory,
			currentRound: state.persistentState.currentRound,
			currentMatch: state.persistentState.currentMatch,
			totalMatches: state.persistentState.totalMatches,
			mode: state.persistentState.mode,
			teams: state.persistentState.teams,
			bracketEntrants: state.persistentState.bracketEntrants,
			lastUpdated: state.persistentState.lastUpdated,
		});
	}, [state.persistentState, state.ratings, setPersistentState, tournamentActions]);

	useEffect(() => {
		if (lastNamesKeyRef.current !== namesKey) {
			initializedRef.current = false;
			lastNamesKeyRef.current = namesKey;
		}
	}, [namesKey]);

	useEffect(() => {
		if (initializedRef.current || !Array.isArray(names) || names.length < 2) {
			return;
		}
		const frameId = requestAnimationFrame(() => {
			const storeT = useAppStore.getState().tournament;
			const eff: PersistentTournamentState =
				persistentState.bracketEntrants && persistentState.bracketEntrants.length > 0
					? persistentState
					: {
							...persistentState,
							matchHistory: storeT.matchHistory ?? persistentState.matchHistory,
							currentRound: storeT.currentRound ?? persistentState.currentRound,
							currentMatch: storeT.currentMatch ?? persistentState.currentMatch,
							totalMatches: storeT.totalMatches ?? persistentState.totalMatches,
							teams: storeT.teams ?? persistentState.teams,
							bracketEntrants: storeT.bracketEntrants ?? persistentState.bracketEntrants,
							mode: (storeT.mode ?? tournamentMode) as TournamentMode,
						};

			const hasValid =
				(persistentState.namesKey === namesKey && persistentState.mode === tournamentMode) ||
				(Boolean(eff.bracketEntrants?.length) && storeT.names?.length === names.length);

			let teams = eff.teams;
			if (tournamentMode === "2v2" && teams.length < 2) {
				teams = generateRandomTeams(names.map((n) => ({ id: String(n.id), name: n.name })));
			}

			const participantIds =
				tournamentMode === "2v2" ? teams.map((t) => t.id) : names.map((n) => String(n.id));
			const nonByeIds = eff.bracketEntrants.filter((id) => !isBye(id));
			const sameIds =
				nonByeIds.length === participantIds.length &&
				participantIds.every((id) => nonByeIds.includes(id));
			const shouldReset = !hasValid || eff.bracketEntrants.length === 0 || !sameIds;

			const initialRatings: Record<string, number> = {};
			for (const n of names) {
				initialRatings[String(n.id)] = n.rating || ELO_RATING.DEFAULT_RATING;
			}
			const activeRatings =
				hasValid && Object.keys(eff.ratings || {}).length > 0 && !shouldReset
					? eff.ratings
					: initialRatings;

			dispatch({
				type: "INIT",
				payload: {
					ratings: activeRatings,
					persistentState: {
						...eff,
						matchHistory: shouldReset ? [] : eff.matchHistory,
						currentRound: shouldReset ? 1 : eff.currentRound,
						currentMatch: shouldReset ? 1 : eff.currentMatch,
						totalMatches: Math.max(0, participantIds.length - 1),
						teams,
						bracketEntrants: shouldReset ? shuffleArray(participantIds) : eff.bracketEntrants,
						namesKey,
						mode: tournamentMode,
						ratings: activeRatings,
					},
				},
			});
			initializedRef.current = true;
		});
		return () => cancelAnimationFrame(frameId);
	}, [names, namesKey, tournamentMode, persistentState]);

	const idToNameMap = useMemo(() => createIdToNameMap(names), [names]);
	const teamsById = useMemo(
		() => createTeamsById(state.persistentState.teams),
		[state.persistentState.teams],
	);
	const bracketDerived = useMemo(
		() =>
			deriveBracketState(state.persistentState.bracketEntrants, state.persistentState.matchHistory),
		[state.persistentState.bracketEntrants, state.persistentState.matchHistory],
	);

	const currentMatch = useMemo(() => {
		void state.refreshKey;
		return resolveCurrentMatch({
			tournamentMode,
			pendingMatchIds: bracketDerived.pendingMatchIds,
			teamsById,
			idToNameMap,
		});
	}, [state.refreshKey, idToNameMap, tournamentMode, bracketDerived.pendingMatchIds, teamsById]);

	const metrics = useMemo(
		() => calculateTournamentMetrics({ derived: bracketDerived }),
		[bracketDerived],
	);

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}
			const leftIds =
				currentMatch.mode === "2v2"
					? currentMatch.left.memberIds
					: [
							String(
								typeof currentMatch.left === "string" ? currentMatch.left : currentMatch.left.id,
							),
						];
			const rightIds =
				currentMatch.mode === "2v2"
					? currentMatch.right.memberIds
					: [
							String(
								typeof currentMatch.right === "string" ? currentMatch.right : currentMatch.right.id,
							),
						];
			const isLeftWinner =
				leftIds.includes(winnerId) ||
				(currentMatch.mode === "2v2" && currentMatch.left.id === winnerId);
			const winnerSideIds = isLeftWinner ? leftIds : rightIds;
			const loserSideIds = isLeftWinner ? rightIds : leftIds;

			tournamentActions.recordVote(
				winnerId,
				loserId,
				winnerSideIds.length > 1 ? winnerSideIds : undefined,
				loserSideIds.length > 1 ? loserSideIds : undefined,
			);

			ratingsAPI
				.applyTournamentMatch({
					userName: userKey,
					leftNameIds: leftIds,
					rightNameIds: rightIds,
					winnerSide: isLeftWinner ? "left" : "right",
				})
				.catch(() => undefined);

			dispatch({
				type: "VOTE",
				payload: {
					currentMatch,
					winnerId,
					loserId,
					matchNumber: metrics.matchNumber,
					round: metrics.round,
					voteTimestamp: Date.now(),
				},
			});
		},
		[currentMatch, metrics.matchNumber, metrics.round, userKey, tournamentActions],
	);

	const voteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentMatchRef = useRef(currentMatch);
	useEffect(() => {
		currentMatchRef.current = currentMatch;
	}, [currentMatch]);

	const handleVoteWithAnimation = useCallback(
		(winnerId: string, loserId: string) => {
			if (isVoting) {
				return;
			}
			const matchAtVoteTime = currentMatchRef.current;
			setIsVoting(true);
			voteTimeoutRef.current = setTimeout(() => {
				if (currentMatchRef.current === matchAtVoteTime) {
					handleVote(winnerId, loserId);
				}
				setIsVoting(false);
			}, TIMING.VOTE_COOLDOWN_MS);
		},
		[handleVote, isVoting],
	);

	useEffect(() => {
		return () => {
			if (voteTimeoutRef.current) {
				clearTimeout(voteTimeoutRef.current);
			}
		};
	}, []);

	const handleUndo = useCallback(() => {
		const lastEntry = state.history[state.history.length - 1];
		if (!lastEntry) {
			toast.showWarning("No more moves to undo");
			return;
		}
		dispatch({ type: "UNDO", payload: { lastEntry } });
		tournamentActions.undoVote();
	}, [state.history, toast, tournamentActions]);

	const handleQuit = useCallback(() => {
		const emptyState = createDefaultPersistentState(userKey);
		dispatch({ type: "QUIT", payload: { defaultState: emptyState } });
		setPersistentState(emptyState);
		tournamentActions.clearVoteHistory();
		tournamentActions.resetTournament();
	}, [setPersistentState, tournamentActions, userKey]);

	return {
		currentMatch,
		ratings: state.ratings,
		round: metrics.round,
		totalRounds: metrics.totalRounds,
		bracketStage: metrics.stageLabel,
		matchNumber: metrics.matchNumber,
		totalMatches: metrics.totalMatches,
		isComplete: bracketDerived.isComplete,
		tournamentMode,
		handleVote,
		handleUndo,
		canUndo: state.history.length > 0,
		handleQuit,
		progress: metrics.progress,
		etaMinutes: metrics.etaMinutes,
		isVoting,
		handleVoteWithAnimation,
		matchHistory: state.persistentState.matchHistory,
		bracketEntrants: state.persistentState.bracketEntrants,
		teams: state.persistentState.teams,
	};
}
