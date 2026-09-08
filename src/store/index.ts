import { useEffect } from "react";
import { create } from "zustand";

import { getStoredTournamentFromIDB } from "@/shared/lib/indexedDB";
import type { StoredTournamentSnapshot } from "@/shared/lib/storage";
import { ErrorManager } from "@/shared/lib/utils";

import { createErrorSlice } from "./errorSlice";
import { createTournamentSlice } from "./tournamentSlice";
import type { AppState } from "./types";
import { createUserAndSettingsSlice } from "./userSettingsSlice";
import { IS_BROWSER } from "./utils";

const useAppStore = create<AppState>()((...args) => ({
	...createTournamentSlice(...args),
	...createUserAndSettingsSlice(...args),
	...createErrorSlice(...args),
}));

export default useAppStore;

/**
 * Hydrates tournament state from IndexedDB if in-memory state is empty or IndexedDB snapshot is newer.
 */
async function hydrateTournamentFromIndexedDB(): Promise<StoredTournamentSnapshot | null> {
	if (!IS_BROWSER) {
		return null;
	}

	try {
		const stored = await getStoredTournamentFromIDB();
		if (!stored) {
			return null;
		}

		const current = useAppStore.getState().tournament;
		const isCurrentEmpty =
			!current.names &&
			(!current.selectedNames || current.selectedNames.length === 0) &&
			(!current.ratings || Object.keys(current.ratings).length === 0);

		if (
			isCurrentEmpty ||
			(stored.lastUpdated &&
				(!current.lastUpdated || stored.lastUpdated > current.lastUpdated))
		) {
			useAppStore.getState().tournamentActions.replaceTournamentState({
				...current,
				names: stored.names ?? null,
				ratings: stored.ratings ?? {},
				isComplete: Boolean(stored.isComplete),
				voteHistory: Array.isArray(stored.voteHistory)
					? stored.voteHistory
					: [],
				selectedNames: Array.isArray(stored.selectedNames)
					? stored.selectedNames
					: [],
				matchHistory: Array.isArray(stored.matchHistory)
					? stored.matchHistory
					: undefined,
				currentRound:
					typeof stored.currentRound === "number"
						? stored.currentRound
						: undefined,
				currentMatch:
					typeof stored.currentMatch === "number"
						? stored.currentMatch
						: undefined,
				totalMatches:
					typeof stored.totalMatches === "number"
						? stored.totalMatches
						: undefined,
				mode: stored.mode,
				teams: stored.teams,
				bracketEntrants: stored.bracketEntrants,
				lastUpdated: stored.lastUpdated,
			});
		}
		return stored;
	} catch (err) {
		ErrorManager.handleError(err, "hydrateTournamentFromIndexedDB");
		return null;
	}
}

export function useAppStoreInitialization(
	onUserContext?: (name: string) => void,
): void {
	const initializeUser = useAppStore(
		(state) => state.userActions.initializeFromStorage,
	);
	const initializeTheme = useAppStore(
		(state) => state.uiActions.initializeTheme,
	);

	useEffect(() => {
		initializeUser(onUserContext);
		initializeTheme();
		void hydrateTournamentFromIndexedDB();
	}, [initializeTheme, initializeUser, onUserContext]);
}

export const errorContexts = {
	tournamentFlow: "Tournament Flow",
	analysisDashboard: "Analysis Dashboard",
	mainLayout: "Main Application Layout",
} as const;
