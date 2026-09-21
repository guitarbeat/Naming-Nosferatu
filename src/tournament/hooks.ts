import {
	type AnimationPlaybackControls,
	animate,
	useMotionValue,
} from "framer-motion";
import {
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { ratingsAPI } from "@/api";
import { useLocalStorage } from "@/hooks";
import { ELO_RATING, TIMING } from "@/lib/constants";
import { createSortedKey, shuffleArray } from "@/lib/utils";
import { useToast } from "@/Providers";
import useAppStore from "@/store";
import type {
	Match,
	MatchRecord,
	NameItem,
	PersistentTournamentState,
	RatingData,
	Team,
	TeamMatch,
	TournamentMode,
} from "@/types";
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
} from "./tournamentEngine";

// ============================================================================
// 1. useTimedState Hook (Consolidated from useTimedState.ts)
// ============================================================================

export function useTimedState<T>(defaultValue: T) {
	const [value, setValue] = useState<T>(defaultValue);
	const timeoutRef = useRef<number | null>(null);
	const defaultRef = useRef(defaultValue);

	useEffect(() => {
		defaultRef.current = defaultValue;
	}, [defaultValue]);

	const clear = useCallback(() => {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const setTimed = useCallback(
		(newValue: T, durationMs: number) => {
			clear();
			setValue(newValue);
			timeoutRef.current = window.setTimeout(() => {
				setValue(defaultRef.current);
				timeoutRef.current = null;
			}, durationMs);
		},
		[clear],
	);

	useEffect(() => clear, [clear]);

	return { value, set: setValue, setTimed, clear } as const;
}

// ============================================================================
// 4. Tournament State persistence helpers (Consolidated from tournamentPersistence.ts)
// ============================================================================

function createDefaultPersistentState(
	userName: string,
): PersistentTournamentState {
	return {
		matchHistory: [],
		currentRound: 1,
		currentMatch: 1,
		totalMatches: 0,
		userName: userName || "anonymous",
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

function buildInitialRatings(names: NameItem[]): Record<string, number> {
	const initial: Record<string, number> = {};
	for (const name of names) {
		initial[String(name.id)] = name.rating || ELO_RATING.DEFAULT_RATING;
	}
	return initial;
}

function createNamesKey(names: NameItem[]): string {
	return createSortedKey(names.map((n) => n?.id || ""));
}

function createTournamentId(names: NameItem[], userName?: string): string {
	const sortedIds = names
		.map((n) => String(n.id))
		.sort()
		.join(",");
	const prefix = userName || "anonymous";
	let hash = 0;
	for (let i = 0; i < sortedIds.length; i++) {
		hash = ((hash << 5) - hash + sortedIds.charCodeAt(i)) | 0;
	}
	return `tournament-${prefix}-${Math.abs(hash).toString(36)}-${names.length}`;
}

function createBracketEntrants(participantIds: string[]): string[] {
	return shuffleArray(participantIds);
}

function isValidTeam(value: unknown): value is Team {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Team;
	return (
		typeof candidate.id === "string" &&
		Array.isArray(candidate.memberIds) &&
		candidate.memberIds.length === 2 &&
		Array.isArray(candidate.memberNames) &&
		candidate.memberNames.length === 2
	);
}

function isValidTeamMatch(value: unknown): value is TeamMatch {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as TeamMatch;
	return (
		typeof candidate.leftTeamId === "string" &&
		typeof candidate.rightTeamId === "string"
	);
}

function sanitizePersistentState(
	persistentStateRaw: unknown,
	userName: string,
): PersistentTournamentState {
	if (
		!persistentStateRaw ||
		typeof persistentStateRaw !== "object" ||
		Array.isArray(persistentStateRaw)
	) {
		return createDefaultPersistentState(userName || "anonymous");
	}

	const merged = {
		...createDefaultPersistentState(userName || "anonymous"),
		...(persistentStateRaw as Record<string, unknown>),
	};

	const mode: TournamentMode = merged.mode === "2v2" ? "2v2" : "1v1";

	// Salvaged from Jules PR #1494: native for loops instead of filter
	const teams: Team[] = [];
	if (Array.isArray(merged.teams)) {
		for (let i = 0; i < merged.teams.length; i++) {
			const team = merged.teams[i];
			if (isValidTeam(team)) {
				teams.push(team);
			}
		}
	}

	const teamMatches: TeamMatch[] = [];
	if (Array.isArray(merged.teamMatches)) {
		for (let i = 0; i < merged.teamMatches.length; i++) {
			const match = merged.teamMatches[i];
			if (isValidTeamMatch(match)) {
				teamMatches.push(match);
			}
		}
	}

	return {
		...merged,
		mode,
		matchHistory: Array.isArray(merged.matchHistory) ? merged.matchHistory : [],
		ratings:
			merged.ratings && typeof merged.ratings === "object"
				? merged.ratings
				: {},
		namesKey: typeof merged.namesKey === "string" ? merged.namesKey : "",
		teams,
		teamMatches,
		teamMatchIndex:
			typeof merged.teamMatchIndex === "number" && merged.teamMatchIndex >= 0
				? merged.teamMatchIndex
				: 0,
		bracketEntrants: Array.isArray(merged.bracketEntrants)
			? merged.bracketEntrants.map(String)
			: [],
	} as PersistentTournamentState;
}

// ============================================================================
// 7. Tournament State Reducer & Actions (Consolidated from tournamentReducer.ts)
// ============================================================================

type TournamentAction =
	| {
			type: "INIT";
			payload: {
				ratings: Record<string, number>;
				persistentState: PersistentTournamentState;
			};
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
				userName: string;
			};
	  }
	| {
			type: "UNDO";
			payload: {
				lastEntry: HistoryEntry;
			};
	  }
	| {
			type: "QUIT";
			payload: {
				defaultState: PersistentTournamentState;
			};
	  };

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
	switch (action.type) {
		case "INIT": {
			return {
				ratings: action.payload.ratings,
				history: [],
				persistentState: action.payload.persistentState,
				refreshKey: state.refreshKey + 1,
			};
		}
		case "VOTE": {
			const {
				currentMatch,
				winnerId,
				loserId,
				matchNumber,
				round,
				voteTimestamp,
			} = action.payload;

			const newRatings = computeUpdatedRatings({
				currentMatch,
				ratingsSnapshot: state.ratings,
				winnerId,
			});

			const matchRecord: MatchRecord = createMatchRecord({
				currentMatch,
				winnerId,
				loserId,
				matchNumber,
				round,
			});

			const newHistoryEntry: HistoryEntry = {
				match: currentMatch,
				ratings: { ...state.ratings },
				round,
				matchNumber,
			};

			return {
				...state,
				ratings: newRatings,
				history: [...state.history, newHistoryEntry],
				persistentState: {
					...state.persistentState,
					matchHistory: [
						...(state.persistentState.matchHistory || []),
						matchRecord,
					],
					currentMatch: matchNumber + 1,
					currentRound: round,
					ratings: newRatings,
					lastUpdated: voteTimestamp,
				},
				refreshKey: state.refreshKey + 1,
			};
		}
		case "UNDO": {
			const { lastEntry } = action.payload;
			const newHistory = state.history.slice(0, -1);
			const newMatchHistory = (state.persistentState.matchHistory || []).slice(
				0,
				-1,
			);

			return {
				...state,
				ratings: lastEntry.ratings,
				history: newHistory,
				persistentState: {
					...state.persistentState,
					matchHistory: newMatchHistory,
					ratings: lastEntry.ratings,
					currentMatch: lastEntry.matchNumber,
					currentRound: lastEntry.round,
				},
				refreshKey: state.refreshKey + 1,
			};
		}
		case "QUIT": {
			return {
				ratings: {},
				history: [],
				persistentState: action.payload.defaultState,
				refreshKey: state.refreshKey + 1,
			};
		}
		default:
			return state;
	}
}

// ============================================================================
// 8. useTournamentState Main Hook (Consolidated from useTournamentState.ts)
// ============================================================================

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
	bracketEntrants?: string[];
	teams?: Team[];
}

const VOTE_COOLDOWN = TIMING.VOTE_COOLDOWN_MS;

// ⚡ Bolt Performance Optimization: Simplified array ID comparison by using native sort instead of Map allocations
function haveSameIds(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let match = true;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			match = false;
			break;
		}
	}
	if (match) {
		return true;
	}

	const sortedA = [...a].sort();
	const sortedB = [...b].sort();

	for (let i = 0; i < sortedA.length; i++) {
		if (sortedA[i] !== sortedB[i]) {
			return false;
		}
	}

	return true;
}

export function useTournamentState(
	names: NameItem[],
	userName?: string,
): UseTournamentStateResult {
	const toast = useToast();
	const [isVoting, setIsVoting] = useState(false);

	const tournamentMode = useMemo(
		() => resolveTournamentMode(names.length),
		[names.length],
	);
	const tournamentActions = useAppStore((state) => state.tournamentActions);

	const namesKey = useMemo(() => createNamesKey(names), [names]);
	const tournamentId = useMemo(
		() => createTournamentId(names, userName),
		[names, userName],
	);

	const defaultPersistentState = useMemo(
		() => createDefaultPersistentState(userName || "anonymous"),
		[userName],
	);

	const [persistentStateRaw, setPersistentState] =
		useLocalStorage<PersistentTournamentState>(
			tournamentId,
			defaultPersistentState,
			{
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

	useEffect(() => {
		if (initializedRef.current) {
			setPersistentState(state.persistentState);

			const ratings = state.ratings;
			const ratingsData: Record<string, RatingData> = {};
			// ⚡ Bolt Performance Optimization: Replace for...in loop with Object.keys indexed iteration to eliminate prototype chain lookup and improve key iteration speed
			const ratingIds = Object.keys(ratings);
			for (let i = 0; i < ratingIds.length; i++) {
				const id = ratingIds[i];
				ratingsData[id] = {
					rating: ratings[id],
					wins: 0,
					losses: 0,
				};
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
		}
	}, [
		state.persistentState,
		state.ratings,
		setPersistentState,
		tournamentActions,
	]);

	useEffect(() => {
		ratingsRef.current = state.ratings;
	}, [state.ratings]);

	useEffect(() => {
		if (lastNamesKeyRef.current !== namesKey) {
			initializedRef.current = false;
			lastNamesKeyRef.current = namesKey;
		}
	}, [namesKey]);

	useEffect(() => {
		if (initializedRef.current) {
			return;
		}

		if (!Array.isArray(names) || names.length < 2) {
			return;
		}

		const initializeTournament = () => {
			const storeTournament = useAppStore.getState().tournament;
			const effectivePersistentState: PersistentTournamentState =
				persistentState.bracketEntrants &&
				persistentState.bracketEntrants.length > 0
					? persistentState
					: {
							...persistentState,
							matchHistory:
								storeTournament.matchHistory ?? persistentState.matchHistory,
							currentRound:
								storeTournament.currentRound ?? persistentState.currentRound,
							currentMatch:
								storeTournament.currentMatch ?? persistentState.currentMatch,
							totalMatches:
								storeTournament.totalMatches ?? persistentState.totalMatches,
							teams: storeTournament.teams ?? persistentState.teams,
							bracketEntrants:
								storeTournament.bracketEntrants ??
								persistentState.bracketEntrants,
							mode: (storeTournament.mode ?? tournamentMode) as TournamentMode,
						};

			const hasValidPersistence =
				(persistentState.namesKey === namesKey &&
					persistentState.mode === tournamentMode) ||
				(Boolean(
					effectivePersistentState.bracketEntrants &&
						effectivePersistentState.bracketEntrants.length > 0,
				) &&
					storeTournament.names?.length === names.length);
			const initialRatings = buildInitialRatings(names);

			let teams = effectivePersistentState.teams;
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
				effectivePersistentState.bracketEntrants.length === 0 ||
				!haveSameIds(
					effectivePersistentState.bracketEntrants.filter((id) => !isBye(id)),
					participantIds,
				);
			const bracketEntrants = shouldResetBracket
				? createBracketEntrants(participantIds)
				: effectivePersistentState.bracketEntrants;

			const stateUpdates: Partial<PersistentTournamentState> = {
				matchHistory: shouldResetBracket
					? []
					: effectivePersistentState.matchHistory,
				currentRound: shouldResetBracket
					? 1
					: effectivePersistentState.currentRound,
				currentMatch: shouldResetBracket
					? 1
					: effectivePersistentState.currentMatch,
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
				(tournamentMode === "2v2" && teams !== effectivePersistentState.teams)
			) {
				stateUpdates.ratings = shouldResetBracket
					? initialRatings
					: effectivePersistentState.ratings;
			}

			const storedRatingsAreFresh =
				(effectivePersistentState.lastUpdated ?? 0) >=
				lastRatingsUpdateRef.current;

			let activeRatings = initialRatings;
			if (
				hasValidPersistence &&
				effectivePersistentState.ratings &&
				Object.keys(effectivePersistentState.ratings).length > 0 &&
				storedRatingsAreFresh
			) {
				activeRatings = effectivePersistentState.ratings;
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
					persistentState: { ...effectivePersistentState, ...stateUpdates },
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
			deriveBracketState(
				state.persistentState.bracketEntrants,
				state.persistentState.matchHistory,
			),
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
	}, [
		state.refreshKey,
		idToNameMap,
		tournamentMode,
		bracketDerived.pendingMatchIds,
		teamsById,
	]);

	const openingEntrants = useMemo(() => {
		// ⚡ Bolt Performance Optimization: Replaced reduce with a for loop to avoid allocations
		const entrants = state.persistentState.bracketEntrants;
		const acc: { id: string; label: string }[] = [];
		for (let i = 0; i < entrants.length; i++) {
			const entrantKey = String(entrants[i]);
			if (!isBye(entrantKey)) {
				if (tournamentMode === "2v2") {
					const team = teamsById.get(entrantKey);
					acc.push({
						id: entrantKey,
						label: team ? team.memberNames.join(" + ") : entrantKey,
					});
				} else {
					const name = idToNameMap.get(entrantKey);
					acc.push({
						id: entrantKey,
						label: name?.name ?? entrantKey,
					});
				}
			}
		}
		return acc;
	}, [
		state.persistentState.bracketEntrants,
		tournamentMode,
		teamsById,
		idToNameMap,
	]);

	const isComplete = bracketDerived.isComplete;
	const metrics = useMemo(
		() =>
			calculateTournamentMetrics({
				derived: bracketDerived,
			}),
		[bracketDerived],
	);
	const {
		totalMatches,
		matchNumber,
		round,
		totalRounds,
		stageLabel,
		progress,
		etaMinutes,
	} = metrics;

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}

			const voteTimestamp = Date.now();
			lastRatingsUpdateRef.current = voteTimestamp;

			const leftIds =
				currentMatch.mode === "2v2"
					? currentMatch.left.memberIds
					: [
							String(
								typeof currentMatch.left === "string"
									? currentMatch.left
									: currentMatch.left.id,
							),
						];
			const rightIds =
				currentMatch.mode === "2v2"
					? currentMatch.right.memberIds
					: [
							String(
								typeof currentMatch.right === "string"
									? currentMatch.right
									: currentMatch.right.id,
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

			const winnerSide = isLeftWinner ? "left" : "right";
			ratingsAPI
				.applyTournamentMatch({
					userName: userName ?? "anonymous",
					leftNameIds: leftIds,
					rightNameIds: rightIds,
					winnerSide,
				})
				.catch((err: unknown) => {
					console.warn(
						"[tournament] apply_tournament_match_elo failed (non-fatal):",
						err,
					);
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
				} else {
					toast.showWarning("Match changed, vote not counted");
				}
				setIsVoting(false);
			}, VOTE_COOLDOWN);
		},
		[handleVote, isVoting, toast],
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

		dispatch({
			type: "UNDO",
			payload: { lastEntry },
		});
		tournamentActions.undoVote();
	}, [state.history, toast, tournamentActions]);

	const handleQuit = useCallback(() => {
		const emptyState = createDefaultPersistentState(userName);
		dispatch({
			type: "QUIT",
			payload: {
				defaultState: emptyState,
			},
		});
		setPersistentState(emptyState);
		tournamentActions.clearVoteHistory();
		tournamentActions.resetTournament();
	}, [setPersistentState, tournamentActions, userName]);

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
		bracketEntrants: state.persistentState.bracketEntrants,
		teams: state.persistentState.teams,
	};
}

// ============================================================================
// ============================================================================
// 4. useInertiaScroll
// ============================================================================
export function useInertiaScroll(
	containerRef: RefObject<HTMLElement | null>,
	prefersReducedMotion: boolean | null,
) {
	const scrollY = useMotionValue(0);
	const rafThrottleRef = useRef<number | null>(null);
	const inertiaControlsRef = useRef<AnimationPlaybackControls | null>(null);
	const lastWheelTsRef = useRef<number>(0);
	const isIntertiaActiveRef = useRef(false);
	const isAutoScrollPausedRef = useRef(false);
	const autoScrollRafRef = useRef<number | null>(null);
	const lastAutoScrollTimeRef = useRef<number>(0);

	// Synchronize scrollY motion value with the DOM scroll position and seamless loop boundaries
	useEffect(() => {
		const unsubscribe = scrollY.on("change", (latest) => {
			const el = containerRef.current;
			const threshold = 180;

			if (el && el.scrollHeight > el.clientHeight) {
				const scrollHeight = el.scrollHeight;
				const clientHeight = el.clientHeight;

				// Infinite loop boundary handling during inertia motion
				if (latest + clientHeight >= scrollHeight - threshold) {
					const offset = latest + clientHeight - (scrollHeight - threshold);
					const wrapped = threshold + offset;
					el.scrollTop = wrapped;
					scrollY.set(wrapped);
					return;
				}
				if (latest <= threshold) {
					const wrapped =
						scrollHeight - (clientHeight + threshold * 2) + latest;
					el.scrollTop = wrapped;
					scrollY.set(wrapped);
					return;
				}

				el.scrollTop = latest;
			} else {
				const docEl = document.documentElement;
				const scrollHeight = docEl.scrollHeight;
				const clientHeight = window.innerHeight;

				if (scrollHeight > clientHeight) {
					if (latest + clientHeight >= scrollHeight - threshold) {
						const offset = latest + clientHeight - (scrollHeight - threshold);
						const wrapped = threshold + offset;
						window.scrollTo({ top: wrapped, behavior: "instant" });
						scrollY.set(wrapped);
						return;
					}
					if (latest <= threshold && latest > 0) {
						const wrapped =
							scrollHeight - (clientHeight + threshold * 2) + latest;
						window.scrollTo({ top: wrapped, behavior: "instant" });
						scrollY.set(wrapped);
						return;
					}

					window.scrollTo({ top: latest, behavior: "instant" });
				}
			}
		});

		return () => {
			unsubscribe();
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}
		};
	}, [scrollY, containerRef]);

	// Custom inertia-based scroll & passive scroll detection
	useEffect(() => {
		const targetEl = containerRef.current;
		if (!targetEl) {
			return;
		}

		// Initialize scrollY motion value to current scroll
		scrollY.set(targetEl.scrollTop || window.scrollY || 0);

		const handleWheel = (e: WheelEvent) => {
			if (prefersReducedMotion) {
				return;
			}

			// Capture current position and calculate velocity for momentum
			const currentY = scrollY.get();
			const now = performance.now();
			const dt = Math.max(
				1,
				Math.min(100, now - (lastWheelTsRef.current || now)),
			);
			lastWheelTsRef.current = now;

			// Stop any ongoing inertia motion
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}

			const impulse = e.deltaY;
			const initialVelocity = (impulse / dt) * 45;

			isIntertiaActiveRef.current = true;

			// Launch custom inertia animation using framer-motion
			inertiaControlsRef.current = animate(scrollY, currentY + impulse * 1.5, {
				type: "inertia",
				velocity: initialVelocity,
				power: 0.8,
				timeConstant: 325,
				restDelta: 0.5,
				onComplete: () => {
					isIntertiaActiveRef.current = false;
					inertiaControlsRef.current = null;
				},
			});
		};

		const handleScroll = () => {
			if (rafThrottleRef.current !== null) {
				return;
			}
			rafThrottleRef.current = window.requestAnimationFrame(() => {
				rafThrottleRef.current = null;

				// Sync motion value when scrolling via scrollbar or touch if inertia animation is not active
				if (!isIntertiaActiveRef.current) {
					const currentTop = targetEl.scrollTop || window.scrollY || 0;
					scrollY.set(currentTop);
				}
			});
		};

		const handlePointerMove = (e: PointerEvent) => {
			const target = e.target as HTMLElement | null;
			if (target?.closest?.("[data-tile-id], .drift-wall__tile")) {
				// Pause/damp inertia momentum immediately when hovering over a contender name
				if (inertiaControlsRef.current) {
					inertiaControlsRef.current.stop();
					inertiaControlsRef.current = null;
					isIntertiaActiveRef.current = false;
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			if (
				active &&
				(active.tagName === "INPUT" ||
					active.tagName === "TEXTAREA" ||
					active.isContentEditable)
			) {
				return;
			}

			// Stop any ongoing inertia scrolling immediately when navigating with keyboard
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
				isIntertiaActiveRef.current = false;
			}

			const key = e.key;
			if (
				key !== "ArrowUp" &&
				key !== "ArrowDown" &&
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "Home" &&
				key !== "End" &&
				key !== "PageUp" &&
				key !== "PageDown"
			) {
				return;
			}

			const container = containerRef.current;
			if (!container) {
				return;
			}

			const tiles = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-tile-id], .drift-wall__tile, [role="button"]',
				),
			).filter(
				(el) =>
					!el.hasAttribute("disabled") &&
					el.getAttribute("aria-hidden") !== "true",
			);

			if (tiles.length === 0) {
				return;
			}

			const activeTileIndex = tiles.findIndex(
				(el) => el === active || el.contains(active),
			);
			let nextTile: HTMLElement | null = null;

			if (activeTileIndex === -1) {
				if (key === "ArrowUp" || key === "End") {
					nextTile = tiles[tiles.length - 1];
				} else {
					nextTile = tiles[0];
				}
			} else {
				const currentTile = tiles[activeTileIndex];
				const currentCol = currentTile.getAttribute("data-col");

				if (currentCol === null) {
					if (key === "ArrowDown") {
						// When at bottom of list, wrap circularly to the top
						const isAtBottom = activeTileIndex >= tiles.length - 1;
						nextTile = isAtBottom ? tiles[0] : tiles[activeTileIndex + 1];
					} else if (key === "ArrowUp") {
						// When at top of list, wrap circularly to the bottom
						const isAtTop = activeTileIndex <= 0;
						nextTile = isAtTop
							? tiles[tiles.length - 1]
							: tiles[activeTileIndex - 1];
					} else if (key === "Home") {
						nextTile = tiles[0];
					} else if (key === "End") {
						nextTile = tiles[tiles.length - 1];
					}
				} else {
					const colTiles = tiles.filter(
						(t) => t.getAttribute("data-col") === currentCol,
					);
					const indexInCol = colTiles.indexOf(currentTile);

					if (key === "ArrowDown") {
						// When hitting the bottom of the column list, shift focus to top
						const isAtBottom = indexInCol >= colTiles.length - 1;
						nextTile = isAtBottom ? colTiles[0] : colTiles[indexInCol + 1];
					} else if (key === "ArrowUp") {
						// When hitting the top of the column list, shift focus to bottom
						const isAtTop = indexInCol <= 0;
						nextTile = isAtTop
							? colTiles[colTiles.length - 1]
							: colTiles[indexInCol - 1];
					} else if (key === "PageDown") {
						const stepIndex = (indexInCol + 4) % colTiles.length;
						nextTile = colTiles[stepIndex];
					} else if (key === "PageUp") {
						const stepIndex =
							(indexInCol - 4 + colTiles.length) % colTiles.length;
						nextTile = colTiles[stepIndex];
					} else if (key === "Home") {
						nextTile = colTiles[0];
					} else if (key === "End") {
						nextTile = colTiles[colTiles.length - 1];
					} else if (key === "ArrowRight" || key === "ArrowLeft") {
						// ⚡ Bolt Performance Optimization: Group tiles by column in a single linear pass to avoid redundant Set instantiation, array allocations, and filtering
						const colMap = new Map<number, HTMLElement[]>();
						for (let i = 0; i < tiles.length; i++) {
							const tile = tiles[i];
							const colAttr = tile.getAttribute("data-col");
							if (colAttr !== null) {
								const col = Number(colAttr);
								let list = colMap.get(col);
								if (!list) {
									list = [];
									colMap.set(col, list);
								}
								list.push(tile);
							}
						}

						const allCols = Array.from(colMap.keys()).sort((a, b) => a - b);
						if (allCols.length > 0) {
							const colNum = Number(currentCol);
							const colIdx = allCols.indexOf(colNum);
							if (colIdx !== -1) {
								const targetColNum =
									key === "ArrowRight"
										? allCols[(colIdx + 1) % allCols.length]
										: allCols[(colIdx - 1 + allCols.length) % allCols.length];
								const targetColTiles = colMap.get(targetColNum) || [];
								const targetIdx = Math.min(
									indexInCol,
									targetColTiles.length - 1,
								);
								nextTile =
									targetColTiles[targetIdx] || targetColTiles[0] || null;
							}
						}
					}
				}
			}

			if (nextTile) {
				e.preventDefault();
				nextTile.focus({ preventScroll: true });

				const rect = nextTile.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				if (rect.top < containerRect.top + 60) {
					const diff = containerRect.top + 80 - rect.top;
					scrollY.set(scrollY.get() - diff);
				} else if (rect.bottom > containerRect.bottom - 60) {
					const diff = rect.bottom - (containerRect.bottom - 80);
					scrollY.set(scrollY.get() + diff);
				}
			}
		};

		const handleMouseEnter = () => {
			isAutoScrollPausedRef.current = true;
		};

		const handleMouseLeave = () => {
			isAutoScrollPausedRef.current = false;
			lastAutoScrollTimeRef.current = performance.now();
		};

		const autoScrollLoop = (time: number) => {
			if (document.hidden) {
				autoScrollRafRef.current = null;
				return;
			}
			const lastTime = lastAutoScrollTimeRef.current || time;
			const dt = Math.min(50, Math.max(1, time - lastTime));
			lastAutoScrollTimeRef.current = time;

			if (!isAutoScrollPausedRef.current && !isIntertiaActiveRef.current) {
				const speed = 0.02;
				const delta = speed * dt;
				scrollY.set(scrollY.get() + delta);
			}

			autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
		};

		if (!prefersReducedMotion) {
			lastAutoScrollTimeRef.current = performance.now();
			autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				if (autoScrollRafRef.current !== null) {
					window.cancelAnimationFrame(autoScrollRafRef.current);
					autoScrollRafRef.current = null;
				}
			} else if (!prefersReducedMotion && autoScrollRafRef.current === null) {
				lastAutoScrollTimeRef.current = performance.now();
				autoScrollRafRef.current = window.requestAnimationFrame(autoScrollLoop);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		targetEl.addEventListener("mouseenter", handleMouseEnter);
		targetEl.addEventListener("mouseleave", handleMouseLeave);
		targetEl.addEventListener("wheel", handleWheel, { passive: true });
		targetEl.addEventListener("scroll", handleScroll, { passive: true });
		targetEl.addEventListener("pointermove", handlePointerMove, {
			passive: true,
		});
		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			targetEl.removeEventListener("mouseenter", handleMouseEnter);
			targetEl.removeEventListener("mouseleave", handleMouseLeave);
			targetEl.removeEventListener("wheel", handleWheel);
			targetEl.removeEventListener("scroll", handleScroll);
			targetEl.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("keydown", handleKeyDown);

			if (autoScrollRafRef.current !== null) {
				window.cancelAnimationFrame(autoScrollRafRef.current);
				autoScrollRafRef.current = null;
			}
			if (rafThrottleRef.current !== null) {
				window.cancelAnimationFrame(rafThrottleRef.current);
				rafThrottleRef.current = null;
			}
			if (inertiaControlsRef.current) {
				inertiaControlsRef.current.stop();
				inertiaControlsRef.current = null;
			}
		};
	}, [prefersReducedMotion, scrollY, containerRef]);

	return scrollY;
}
