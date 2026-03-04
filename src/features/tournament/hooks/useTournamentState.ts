import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/providers/Providers";
import {
	EloRating,
	PreferenceSorter,
	applyTeamMatchElo,
	buildTeamMatches,
	generateRandomTeams,
	resolveTournamentMode,
} from "@/services/tournament";
import { useLocalStorage } from "@/shared/hooks";
import { ELO_RATING } from "@/shared/lib/constants";
import type { Match, MatchRecord, NameItem, Team, TeamMatch, TournamentMode } from "@/shared/types";
import { useAudioManager } from "./useHelpers";

export interface UseTournamentStateResult {
	currentMatch: Match | null;
	ratings: Record<string, number>;
	round: number;
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
}

const VOTE_COOLDOWN = 300;

interface HistoryEntry {
	match: Match;
	ratings: Record<string, number>;
	round: number;
	matchNumber: number;
}

interface PersistentTournamentState {
	matchHistory: MatchRecord[];
	currentRound: number;
	currentMatch: number;
	totalMatches: number;
	userName: string;
	lastUpdated: number;
	namesKey: string;
	ratings: Record<string, number>;
	mode: TournamentMode;
	teams: Team[];
	teamMatches: TeamMatch[];
	teamMatchIndex: number;
}

function createDefaultPersistentState(userName: string): PersistentTournamentState {
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
	};
}

function buildInitialRatings(names: NameItem[]): Record<string, number> {
	const initial: Record<string, number> = {};
	for (const name of names) {
		initial[String(name.id)] = name.rating || ELO_RATING.DEFAULT_RATING;
	}
	return initial;
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
	return typeof candidate.leftTeamId === "string" && typeof candidate.rightTeamId === "string";
}

export function useTournamentState(names: NameItem[], userName?: string): UseTournamentStateResult {
	const toast = useToast();
	const audioManager = useAudioManager();
	const [isVoting, setIsVoting] = useState(false);
	const [ratings, setRatings] = useState<Record<string, number>>({});
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [refreshKey, setRefreshKey] = useState(0);
	const [elo] = useState(() => new EloRating());
	const tournamentMode = useMemo(() => resolveTournamentMode(names.length), [names.length]);

	const namesKey = useMemo(
		() =>
			names
				.map((n) => n?.id || n?.name || "")
				.filter(Boolean)
				.map(String)
				.sort()
				.join(","),
		[names],
	);

	const tournamentId = useMemo(() => {
		const sortedNames = names
			.map((n) => n.name || String(n.id))
			.sort()
			.join("-");
		const prefix = userName || "anonymous";
		return `tournament-${prefix}-${sortedNames}`;
	}, [names, userName]);

	const defaultPersistentState = useMemo(
		() => createDefaultPersistentState(userName || "anonymous"),
		[userName],
	);

	const [persistentStateRaw, setPersistentState] = useLocalStorage<PersistentTournamentState>(
		tournamentId,
		defaultPersistentState,
		{ debounceWait: 1000 },
	);

	const persistentState = useMemo((): PersistentTournamentState => {
		if (
			!persistentStateRaw ||
			typeof persistentStateRaw !== "object" ||
			Array.isArray(persistentStateRaw)
		) {
			return createDefaultPersistentState(userName || "anonymous");
		}

		const merged = {
			...createDefaultPersistentState(userName || "anonymous"),
			...persistentStateRaw,
		};

		const mode = merged.mode === "2v2" ? "2v2" : "1v1";
		const teams = Array.isArray(merged.teams) ? merged.teams.filter(isValidTeam) : [];
		const teamMatches = Array.isArray(merged.teamMatches)
			? merged.teamMatches.filter(isValidTeamMatch)
			: [];

		return {
			...merged,
			mode,
			matchHistory: Array.isArray(merged.matchHistory) ? merged.matchHistory : [],
			ratings: merged.ratings && typeof merged.ratings === "object" ? merged.ratings : {},
			namesKey: typeof merged.namesKey === "string" ? merged.namesKey : "",
			teams,
			teamMatches,
			teamMatchIndex:
				typeof merged.teamMatchIndex === "number" && merged.teamMatchIndex >= 0
					? merged.teamMatchIndex
					: 0,
		};
	}, [persistentStateRaw, userName]);

	const updatePersistentState = useCallback(
		(
			updates:
				| Partial<PersistentTournamentState>
				| ((prev: PersistentTournamentState) => Partial<PersistentTournamentState>),
		) => {
			setPersistentState((prev) => {
				const delta = typeof updates === "function" ? updates(prev) || {} : updates || {};
				return {
					...prev,
					...delta,
					lastUpdated: Date.now(),
					userName: userName || "anonymous",
				};
			});
		},
		[setPersistentState, userName],
	);

	const sorter = useMemo(() => new PreferenceSorter(names.map((n) => String(n.id))), [names]);
	const ratingsRef = useRef(ratings);
	const initializedRef = useRef(false);
	const lastNamesKeyRef = useRef("");

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

		const hasValidPersistence =
			persistentState.namesKey === namesKey && persistentState.mode === tournamentMode;

		if (hasValidPersistence) {
			if (tournamentMode === "1v1" && sorter.currentIndex === 0 && persistentState.matchHistory.length > 0) {
				for (const record of persistentState.matchHistory) {
					if (record.winner && record.loser) {
						sorter.addPreference(record.winner, record.loser, 1);
					}
				}
			}

			if (persistentState.ratings && Object.keys(persistentState.ratings).length > 0) {
				setRatings(persistentState.ratings);
			} else {
				setRatings(buildInitialRatings(names));
			}

			if (tournamentMode === "2v2") {
				const shouldRebuildTeams = persistentState.teams.length < 2;
				const shouldRebuildMatches = persistentState.teamMatches.length === 0;
				if (shouldRebuildTeams || shouldRebuildMatches) {
					const generatedTeams = generateRandomTeams(
						names.map((name) => ({ id: String(name.id), name: name.name })),
					);
					const generatedMatches = buildTeamMatches(generatedTeams);
					updatePersistentState({
						teams: generatedTeams,
						teamMatches: generatedMatches,
						totalMatches: generatedMatches.length,
						teamMatchIndex: Math.min(persistentState.teamMatchIndex, generatedMatches.length),
					});
				}
			}
		} else {
			const initialRatings = buildInitialRatings(names);

			if (tournamentMode === "2v2") {
				const generatedTeams = generateRandomTeams(
					names.map((name) => ({ id: String(name.id), name: name.name })),
				);
				const generatedMatches = buildTeamMatches(generatedTeams);
				setRatings(initialRatings);
				updatePersistentState({
					matchHistory: [],
					currentRound: 1,
					currentMatch: 1,
					totalMatches: generatedMatches.length,
					namesKey,
					ratings: initialRatings,
					mode: "2v2",
					teams: generatedTeams,
					teamMatches: generatedMatches,
					teamMatchIndex: 0,
				});
			} else {
				const estimatedMatches = (names.length * (names.length - 1)) / 2;
				setRatings(initialRatings);
				updatePersistentState({
					matchHistory: [],
					currentRound: 1,
					currentMatch: 1,
					totalMatches: estimatedMatches,
					namesKey,
					ratings: initialRatings,
					mode: "1v1",
					teams: [],
					teamMatches: [],
					teamMatchIndex: 0,
				});
			}
		}

		initializedRef.current = true;
		setRefreshKey((k) => k + 1);
	}, [namesKey, persistentState, sorter, names, updatePersistentState, tournamentMode]);

	const idToNameMap = useMemo(() => {
		const map = new Map<string, NameItem>();
		names.forEach((n) => {
			map.set(String(n.id), n);
		});
		return map;
	}, [names]);

	const teamsById = useMemo(() => {
		const map = new Map<string, Team>();
		for (const team of persistentState.teams) {
			map.set(team.id, team);
		}
		return map;
	}, [persistentState.teams]);

	const currentMatch = useMemo(() => {
		void refreshKey;

		if (tournamentMode === "2v2") {
			const teamMatch = persistentState.teamMatches[persistentState.teamMatchIndex];
			if (!teamMatch) {
				return null;
			}
			const leftTeam = teamsById.get(teamMatch.leftTeamId);
			const rightTeam = teamsById.get(teamMatch.rightTeamId);
			if (!leftTeam || !rightTeam) {
				return null;
			}
			return {
				mode: "2v2",
				left: leftTeam,
				right: rightTeam,
			} as Match;
		}

		const nextMatch = sorter.getNextMatch();
		if (!nextMatch) {
			return null;
		}

		return {
			mode: "1v1",
			left: idToNameMap.get(nextMatch.left) || {
				id: nextMatch.left,
				name: nextMatch.left,
			},
			right: idToNameMap.get(nextMatch.right) || {
				id: nextMatch.right,
				name: nextMatch.right,
			},
		} as Match;
	}, [sorter, refreshKey, idToNameMap, tournamentMode, persistentState.teamMatches, persistentState.teamMatchIndex, teamsById]);

	const isComplete = currentMatch === null;
	const totalMatches =
		tournamentMode === "2v2"
			? persistentState.teamMatches.length
			: (names.length * (names.length - 1)) / 2;
	const completedMatches = persistentState.matchHistory.length;
	const matchNumber = isComplete ? completedMatches : completedMatches + 1;
	const roundMatchIndex = Math.max(1, matchNumber);
	const roundSize = tournamentMode === "2v2" ? Math.max(1, persistentState.teams.length) : Math.max(1, names.length);
	const round = Math.floor((roundMatchIndex - 1) / roundSize) + 1;

	const progress = useMemo(() => {
		if (!totalMatches) {
			return 0;
		}
		return Math.round((Math.min(completedMatches, totalMatches) / totalMatches) * 100);
	}, [completedMatches, totalMatches]);

	const etaMinutes = useMemo(() => {
		if (!totalMatches || completedMatches >= totalMatches) {
			return 0;
		}
		const remaining = totalMatches - completedMatches;
		return Math.ceil((remaining * 3) / 60);
	}, [completedMatches, totalMatches]);

	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}

			const ratingsSnapshot = ratingsRef.current;
			let newRatings: Record<string, number>;

			if (tournamentMode === "2v2" && currentMatch.mode === "2v2") {
				const winnerSide = winnerId === currentMatch.left.id ? "left" : "right";
				newRatings = applyTeamMatchElo({
					elo,
					ratings: ratingsSnapshot,
					leftTeam: currentMatch.left,
					rightTeam: currentMatch.right,
					winnerSide,
				});
			} else {
				const winnerRating = ratingsSnapshot[winnerId] || ELO_RATING.DEFAULT_RATING;
				const loserRating = ratingsSnapshot[loserId] || ELO_RATING.DEFAULT_RATING;

				const leftId = String(
					typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
				);
				const outcome = winnerId === leftId ? "left" : "right";

				const result = elo.calculateNewRatings(winnerRating, loserRating, outcome);
				newRatings = {
					...ratingsSnapshot,
					[winnerId]: result.newRatingA,
					[loserId]: result.newRatingB,
				};
			}

			setRatings(newRatings);

			const matchRecord: MatchRecord = {
				match: currentMatch,
				winner: winnerId,
				loser: loserId,
				voteType: "normal",
				matchNumber,
				roundNumber: round,
				timestamp: Date.now(),
			};

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
				teamMatchIndex:
					tournamentMode === "2v2" ? Math.min(prev.teamMatchIndex + 1, prev.teamMatches.length) : prev.teamMatchIndex,
				ratings: newRatings,
			}));

			if (tournamentMode === "1v1") {
				sorter.addPreference(winnerId, loserId, 1);
			}

			setRefreshKey((k) => k + 1);
		},
		[currentMatch, elo, matchNumber, round, sorter, updatePersistentState, tournamentMode],
	);

	const handleVoteWithAnimation = useCallback(
		(winnerId: string, loserId: string) => {
			if (isVoting) {
				return;
			}
			setIsVoting(true);
			audioManager.playVoteSound();
			setTimeout(() => {
				handleVote(winnerId, loserId);
				setIsVoting(false);
			}, VOTE_COOLDOWN);
		},
		[handleVote, isVoting, audioManager],
	);

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
		if (tournamentMode === "1v1") {
			sorter.undoLastPreference();
		}
		setRefreshKey((k) => k + 1);

		updatePersistentState((prev) => {
			const newHistory = (prev.matchHistory || []).slice(0, -1);
			return {
				matchHistory: newHistory,
				currentMatch: Math.max(1, prev.currentMatch - 1),
				currentRound: Math.max(1, prev.currentRound - (prev.currentMatch % roundSize === 0 ? 1 : 0)),
				teamMatchIndex:
					tournamentMode === "2v2" ? Math.max(0, prev.teamMatchIndex - 1) : prev.teamMatchIndex,
				ratings: lastEntry.ratings,
			};
		});
	}, [audioManager, history, sorter, toast, updatePersistentState, tournamentMode, roundSize]);

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
		});
		setHistory([]);
		setRatings({});
		setRefreshKey((key) => key + 1);
	}, [updatePersistentState]);

	return {
		currentMatch,
		ratings,
		round,
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
	};
}
