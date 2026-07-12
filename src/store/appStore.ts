import { useEffect } from "react";
import { create } from "zustand";
import type { AppState } from "@/store/appStore.types";
import { createErrorSlice } from "@/store/slices/errorSlice";
import { createTournamentSlice } from "@/store/slices/tournamentSlice";
import { createUserAndSettingsSlice } from "@/store/slices/userSettingsSlice";

export type { NameItem, RatingData, TournamentActions } from "@/store/appStore.types";

const useAppStore = create<AppState>()((...args) => ({
	...createTournamentSlice(...args),
	...createUserAndSettingsSlice(...args),
	...createErrorSlice(...args),
}));

export default useAppStore;

export function useAppStoreInitialization(onUserContext?: (name: string) => void): void {
	const initializeUser = useAppStore((state) => state.userActions.initializeFromStorage);
	const initializeTheme = useAppStore((state) => state.uiActions.initializeTheme);

	useEffect(() => {
		initializeUser(onUserContext);
		initializeTheme();
	}, [initializeTheme, initializeUser, onUserContext]);
}

export const errorContexts = {
	tournamentFlow: "Tournament Flow",
	analysisDashboard: "Analysis Dashboard",
	mainLayout: "Main Application Layout",
} as const;
