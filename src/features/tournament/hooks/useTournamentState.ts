import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import type {
	MatchResult,
	TournamentUpdate,
	UserActivity,
} from "@/features/tournament/hooks/useTournamentRealtime";
import { resolveTournamentMode } from "@/features/tournament/services/tournament";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
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
	createDefaultPersistentState,
	createNamesKey,
	createTournamentId,
	sanitizePersistentState,
} from "./tournamentPersistence";
import { tournamentReducer } from "./tournamentReducer";
import { useAudioManager } from "./useAudioManager";
import { useTournamentActions } from "./useTournamentActions";
import { useTournamentInitialization } from "./useTournamentInitialization";
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
	subscribeToUserActivity?: (
		callback: (activity: UserActivity) => void,
	) => void;
}

export function useTournamentState(
	names: NameItem[],
	userName?: string,
): UseTournamentStateResult {
	const toast = useToast();
	const audioManager = useAudioManager();
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

	const realtime = useTournamentRealtime({ autoConnect: true });

	const defaultPersistentState = useMemo(
		() => createDefaultPersistentState(userName || "anonymous"),
		[userName],
	);

	const [persistentStateRaw, setPersistentState] =
		useLocalStorage<PersistentTournamentState>(
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

	useTournamentInitialization({
		names,
		namesKey,
		tournamentMode,
		persistentState,
		initializedRef,
		lastRatingsUpdateRef,
		ratingsRef,
		dispatch,
	});

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
		[
			state.persistentState.bracketEntrants,
			tournamentMode,
			teamsById,
			idToNameMap,
		],
	);

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

	const { handleVote, handleVoteWithAnimation, handleUndo, handleQuit } =
		useTournamentActions({
			currentMatch,
			matchNumber,
			round,
			userName: userName || "anonymous",
			tournamentActions,
			dispatch,
			isVoting,
			setIsVoting,
			audioManager,
			toast,
			lastRatingsUpdateRef,
			stateHistory: state.history,
		});

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
