/**
 * TournamentStore - Zustand store for tournament setup state
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CatName } from "../services/tournamentService";

interface TournamentStoreState {
	// Available names from database
	availableNames: CatName[];
	// Set of selected name IDs
	selectedNames: Set<string>;
	// Search query for filtering
	searchQuery: string;
	// Operator identity (user name)
	operatorIdentity: string;
}

interface TournamentStoreActions {
	setAvailableNames: (names: CatName[]) => void;
	toggleNameSelection: (id: string) => void;
	selectAll: () => void;
	clearSelections: () => void;
	setSearchQuery: (query: string) => void;
	setOperatorIdentity: (identity: string) => void;
	reset: () => void;
}

type TournamentStore = TournamentStoreState & TournamentStoreActions;

const initialState: TournamentStoreState = {
	availableNames: [],
	selectedNames: new Set<string>(),
	searchQuery: "",
	operatorIdentity: "Anonymous",
};

export const useTournamentStore = create<TournamentStore>()(
	devtools(
		(set, get) => ({
			...initialState,

			setAvailableNames: (names) =>
				set({ availableNames: names }, false, "setAvailableNames"),

			toggleNameSelection: (id) =>
				set(
					(state) => {
						const newSelected = new Set(state.selectedNames);
						if (newSelected.has(id)) {
							newSelected.delete(id);
						} else {
							newSelected.add(id);
						}
						return { selectedNames: newSelected };
					},
					false,
					"toggleNameSelection",
				),

			selectAll: () =>
				set(
					(state) => ({
						selectedNames: new Set(state.availableNames.map((n) => n.id)),
					}),
					false,
					"selectAll",
				),

			clearSelections: () =>
				set({ selectedNames: new Set<string>() }, false, "clearSelections"),

			setSearchQuery: (query) =>
				set({ searchQuery: query }, false, "setSearchQuery"),

			setOperatorIdentity: (identity) =>
				set({ operatorIdentity: identity }, false, "setOperatorIdentity"),

			reset: () => set(initialState, false, "reset"),
		}),
		{ name: "TournamentStore" },
	),
);
