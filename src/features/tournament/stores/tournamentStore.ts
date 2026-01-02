import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CatName } from "../services/tournamentService";

interface TournamentState {
	// Data
	availableNames: CatName[];
	selectedNames: Set<string>; // IDs
	operatorIdentity: string;

	// UI State
	isLoading: boolean;
	error: string | null;
	isSidebarOpen: boolean;
	searchQuery: string;

	// Actions
	setAvailableNames: (names: CatName[]) => void;
	toggleNameSelection: (id: string) => void;
	setOperatorIdentity: (name: string) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	toggleSidebar: () => void;
	setSearchQuery: (query: string) => void;
	clearSelections: () => void;
	selectAll: () => void;
}

export const useTournamentStore = create<TournamentState>()(
	devtools((set) => ({
		// Initial State
		availableNames: [],
		selectedNames: new Set(),
		operatorIdentity: "Guest Operator",
		isLoading: false,
		error: null,
		isSidebarOpen: true,
		searchQuery: "",

		// Actions
		setAvailableNames: (names) => set({ availableNames: names }),

		toggleNameSelection: (id) =>
			set((state) => {
				const newSet = new Set(state.selectedNames);
				if (newSet.has(id)) {
					newSet.delete(id);
				} else {
					newSet.add(id);
				}
				return { selectedNames: newSet };
			}),

		setOperatorIdentity: (name) => set({ operatorIdentity: name }),

		setLoading: (loading) => set({ isLoading: loading }),

		setError: (error) => set({ error }),

		toggleSidebar: () =>
			set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

		setSearchQuery: (query) => set({ searchQuery: query }),

		clearSelections: () => set({ selectedNames: new Set() }),

		selectAll: () =>
			set((state) => ({
				selectedNames: new Set(state.availableNames.map((n) => n.id)),
			})),
	})),
);
