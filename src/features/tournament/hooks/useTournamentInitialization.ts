import { useEffect } from "react";
import { generateRandomTeams } from "@/features/tournament/services/tournament";
import type { NameItem, PersistentTournamentState, TournamentMode } from "@/shared/types";
import { buildInitialRatings, createBracketEntrants } from "./tournamentPersistence";

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

	const map = new Map<string, number>();
	for (let i = 0; i < a.length; i++) {
		const val = a[i];
		if (val != null) {
			map.set(val, (map.get(val) || 0) + 1);
		}
	}
	for (let i = 0; i < b.length; i++) {
		const val = b[i];
		if (val != null) {
			const count = map.get(val);
			if (!count) {
				return false;
			}
			map.set(val, count - 1);
		}
	}

	return true;
}

interface UseTournamentInitializationProps {
	names: NameItem[];
	namesKey: string;
	tournamentMode: TournamentMode;
	persistentState: PersistentTournamentState;
	initializedRef: React.MutableRefObject<boolean>;
	lastRatingsUpdateRef: React.MutableRefObject<number>;
	ratingsRef: React.MutableRefObject<Record<string, number>>;
	dispatch: React.Dispatch<any>;
}

export function useTournamentInitialization({
	names,
	namesKey,
	tournamentMode,
	persistentState,
	initializedRef,
	lastRatingsUpdateRef,
	ratingsRef,
	dispatch,
}: UseTournamentInitializationProps) {
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
	}, [
		names,
		namesKey,
		tournamentMode,
		persistentState,
		initializedRef,
		lastRatingsUpdateRef,
		ratingsRef,
		dispatch,
	]);
}
