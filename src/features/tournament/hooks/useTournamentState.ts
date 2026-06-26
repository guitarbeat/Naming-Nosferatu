import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import type {
	MatchResult,
	TournamentUpdate,
	UserActivity,
} from "@/features/tournament/hooks/useTournamentRealtime";
import {
	generateRandomTeams,
	resolveTournamentMode,
} from "@/features/tournament/services/tournament";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { TIMING } from "@/shared/lib/constants";
import { ratingsAPI } from "@/shared/services/supabase/ratingService";
import type {
	Match,
	MatchRecord,
	NameItem,
	PersistentTournamentState,
	TournamentMode,
} from "@/shared/types";
import useAppStore from "@/store/appStore";
import {
	calculateTournamentMetrics,
	createIdToNameMap,
	createTeamsById,
	deriveBracketState,
	resolveCurrentMatch,
} from "../utils/tournamentLogic";
import {
	buildInitialRatings,
	createBracketEntrants,
	createDefaultPersistentState,
	createNamesKey,
	createTournamentId,
	sanitizePersistentState,
} from "./tournamentPersistence";
import { tournamentReducer } from "./tournamentReducer";
import { useAudioManager } from "./useAudioManager";
import { useTournamentRealtime } from "./useTournamentRealtime";

interface UseTournamentStateResult {
	currentMatch: Match | null;
	ratings: Record<string, number>;
	openingEntrants: Array<{ id: string; label: string }>;
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
	subscribeToTournamentUpdates?: (
		tournamentId: string,
		callback: (update: TournamentUpdate) => void,
	) => void;
	subscribeToMatchResults?: (callback: (result: MatchResult) => void) => void;
	subscribeToUserActivity?: (callback: (activity: UserActivity) => void) => void;
}

const VOTE_COOLDOWN = TIMING.VOTE_COOLDOWN_MS;

function haveSameIds(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	// ⚡ Bolt Optimization: Replacing O(N log N) `[...arr].sort()` chains
	// with a fast-path sequential check and an O(N) Frequency Map-based comparison.
	// This avoids expensive array allocations, improves comparison performance significantly,
	// and accurately handles identical duplicate occurrences.
	if (a === b) {
		return true;
	}
	let isSequentialMatch = true;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			isSequentialMatch = false;
			break;
		}
	}
	if (isSequentialMatch) {
		return true;
	}

	const counts = new Map<string, number>();
	for (let i = 0; i < a.length; i++) {
		counts.set(a[i], (counts.get(a[i]) || 0) + 1);
	}
	for (let i = 0; i < b.length; i++) {
		const count = counts.get(b[i]);
		if (!count) {
			return false;
		}
		if (count === 1) {
			counts.delete(b[i]);
		} else {
			counts.set(b[i], count - 1);
		}
	}
	return counts.size === 0;
}

export function useTournamentState(names: NameItem[], userName?: string): UseTournamentStateResult {
	const toast = useToast();
	const audioManager = useAudioManager();
	const [isVoting, setIsVoting] = useState(false);

	const tournamentMode = useMemo(() => resolveTournamentMode(names.length), [names.length]);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

	const namesKey = useMemo(() => createNamesKey(names), [names]);
	const tournamentId = useMemo(() => createTournamentId(names, userName), [names, userName]);

	const realtime = useTournamentRealtime({ autoConnect: true });

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

	// Reducer State Machine Integration
	const [state, dispatch] = useReducer(tournamentReducer, {
		ratings: {},
		history: [],
		persistentState: defaultPersistentState,
		refreshKey: 0,
	});

	const ratingsRef = useRef(state.ratings);
	const initializedRef = useRef(false);
	const lastNamesKeyRef = useRef("");
	const lastRatingsUpdateRef = useRef(0);

	// Sync local storage when persistentState in the reducer changes
	useEffect(() => {
		if (initializedRef.current) {
			setPersistentState(state.persistentState);
		}
	}, [state.persistentState, setPersistentState]);

	// Cleanup WebSocket connections on unmount
	useEffect(() => {
		return () => {
			if (realtime && typeof realtime.cleanup === "function") {
				realtime.cleanup();
			}
		};
	}, [realtime]);

	useEffect(() => {
		ratingsRef.current = state.ratings;
	}, [state.ratings]);

	if (lastNamesKeyRef.current !== namesKey) {
		initializedRef.current = false;
		lastNamesKeyRef.current = namesKey;
	}

	useEffect(() => {
		if (initializedRef.current) {
			return;
		}

		if (!Array.isArray(names) || names.length < 2) {
			return;
		}

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

			const storedRatingsAreFresh =
				(persistentState.lastUpdated ?? 0) >= lastRatingsUpdateRef.current;

			let activeRatings = initialRatings;
			if (
				hasValidPersistence &&
				persistentState.ratings &&
				Object.keys(persistentState.ratings).length > 0 &&
				storedRatingsAreFresh
			) {
				activeRatings = persistentState.ratings;
			} else if (lastRatingsUpdateRef.current > 0) {
				activeRatings = ratingsRef.current;
			} else {
				if (!stateUpdates.ratings) {
					stateUpdates.ratings = initialRatings;
				}
			}

			dispatch({
				type: "INIT",
				payload: {
					ratings: activeRatings,
					persistentState: { ...persistentState, ...stateUpdates },
				},
			});

			initializedRef.current = true;
		};

		let frameId: number | null = null;
		frameId = requestAnimationFrame(initializeTournament);

		return () => {
			if (frameId !== null) {
				cancelAnimationFrame(frameId);
			}
		};
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

	const openingEntrants = useMemo(
		() =>
			state.persistentState.bracketEntrants
				.filter((entrantId) => !String(entrantId).startsWith("__BYE__"))
				.map((entrantId) => {
					const entrantKey = String(entrantId);
					if (tournamentMode === "2v2") {
						const team = teamsById.get(entrantKey);
						return {
							id: entrantKey,
							label: team ? team.memberNames.join(" + ") : entrantKey,
						};
					}

					const name = idToNameMap.get(entrantKey);
					return {
						id: entrantKey,
						label: name?.name ?? entrantKey,
					};
				}),
		[state.persistentState.bracketEntrants, tournamentMode, teamsById, idToNameMap],
	);

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

			const voteTimestamp = Date.now();
			lastRatingsUpdateRef.current = voteTimestamp;

			const leftIds =
				currentMatch.mode === "2v2" ? currentMatch.left.memberIds : [String(currentMatch.left.id)];
			const rightIds =
				currentMatch.mode === "2v2"
					? currentMatch.right.memberIds
					: [String(currentMatch.right.id)];

			const winnerSideIds = leftIds.includes(winnerId) ? leftIds : rightIds;
			const loserSideIds = leftIds.includes(winnerId) ? rightIds : leftIds;

			tournamentActions.recordVote(
				winnerId,
				loserId,
				winnerSideIds.length > 1 ? winnerSideIds : undefined,
				loserSideIds.length > 1 ? loserSideIds : undefined,
			);

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

			dispatch({
				type: "VOTE",
				payload: {
					currentMatch,
					winnerId,
					loserId,
					matchNumber,
					round,
					voteTimestamp,
					userName: userName || "anonymous",
				},
			});
		},
		[currentMatch, matchNumber, round, userName, tournamentActions.recordVote],
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

	useEffect(() => {
		return () => {
			if (voteTimeoutRef.current) {
				clearTimeout(voteTimeoutRef.current);
			}
		};
	}, []);

	const handleUndo = useCallback(() => {
		if (state.history.length === 0) {
			toast.showWarning("No more moves to undo");
			return;
		}

		const lastEntry = state.history[state.history.length - 1];
		if (!lastEntry) {
			return;
		}

		audioManager.playUndoSound();
		dispatch({
			type: "UNDO",
			payload: { lastEntry },
		});
	}, [audioManager, state.history, toast]);

	const handleQuit = useCallback(() => {
		dispatch({
			type: "QUIT",
			payload: {
				defaultState: {
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
				},
			},
		});
		tournamentActions.clearVoteHistory();
	}, [tournamentActions]);

	return {
		currentMatch,
		ratings: state.ratings,
		openingEntrants,
		round,
		totalRounds,
		bracketStage: stageLabel,
		matchNumber,
		totalMatches,
		isComplete,
		tournamentMode,
		handleVote,
		handleUndo,
		canUndo: state.history.length > 0,
		handleQuit,
		progress,
		etaMinutes,
		isVoting,
		handleVoteWithAnimation,
		matchHistory: state.persistentState.matchHistory,
		subscribeToTournamentUpdates: realtime.subscribeToTournament,
		subscribeToMatchResults: realtime.subscribeToMatches,
		subscribeToUserActivity: realtime.subscribeToUserActivity,
	};
}
