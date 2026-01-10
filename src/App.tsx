/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useState } from "react";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
import {
	useKeyboardShortcuts,
	useRouting,
	useTournamentRoutingSync,
} from "./core/hooks/useRouting";
// * Core state and routing hooks
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, { useAppStoreInitialization } from "./core/store/useAppStore";
import { Loading } from "./shared/components/Loading";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ToastProvider } from "./shared/providers/ToastProvider";
import { ErrorManager } from "./shared/services/errorManager";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils";
import type { AppState } from "./types/store";

/**
 * Root application component that wires together global state, routing, and
 * layout providers for the cat name tournament experience.
 */
function App() {
	const { login, isInitialized } = useUserSession();
	const [isSuggestNameModalOpen, setIsSuggestNameModalOpen] = useState(false);

	// Initialize performance monitoring and global error handling
	useEffect(() => {
		initializePerformanceMonitoring();
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanupPerformanceMonitoring();
			cleanup();
		};
	}, []);

	// Initialize store from localStorage
	useAppStoreInitialization();

	// Centralized store
	const { user, tournament, ui, tournamentActions } = useAppStore();

	// Explicitly select currentView to ensure re-renders when it changes
	const currentView = useAppStore((state: AppState) => state.tournament.currentView);

	// Simple URL routing helpers
	const { currentRoute, navigateTo } = useRouting();

	useTournamentRoutingSync({
		currentRoute,
		navigateTo,
		isLoggedIn: user.isLoggedIn,
		currentView,
		onViewChange: tournamentActions.setView,
		isTournamentComplete: tournament.isComplete,
	});

	// Keyboard shortcuts
	useKeyboardShortcuts({
		navigateTo,
		onAnalysisToggle: () => {
			// Analysis toggle handled via URL
		},
	});

	// Theme synchronization
	useEffect(() => {
		if (typeof window !== "undefined") {
			document.documentElement.setAttribute("data-theme", ui.theme);
			if (ui.theme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}
	}, [ui.theme]);

	// Tournament handlers
	const {
		handleTournamentComplete,
		handleStartNewTournament,
		handleTournamentSetup,
		handleUpdateRatings,
	} = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
		navigateTo,
	});

	// Handle user login
	const handleLogin = useCallback(
		async (userName: string) => {
			try {
				const success = await login(userName);
				return success;
			} catch (error) {
				devError("Login error:", error);
				throw error;
			}
		},
		[login],
	);

	// Modal handlers
	const handleOpenSuggestName = useCallback(() => {
		setIsSuggestNameModalOpen(true);
	}, []);

	const handleCloseSuggestName = useCallback(() => {
		setIsSuggestNameModalOpen(false);
	}, []);

	// Show loading screen while initializing
	if (!isInitialized) {
		return (
			<div className="fullScreenCenter">
				<Loading variant="spinner" text="Loading..." />
			</div>
		);
	}

	return (
		<ToastProvider>
			<AppLayout
				handleLogin={handleLogin}
				handleStartNewTournament={handleStartNewTournament}
				handleUpdateRatings={handleUpdateRatings}
				handleTournamentSetup={handleTournamentSetup}
				handleTournamentComplete={handleTournamentComplete}
				isSuggestNameModalOpen={isSuggestNameModalOpen}
				onCloseSuggestName={handleCloseSuggestName}
				onOpenSuggestName={handleOpenSuggestName}
			/>
		</ToastProvider>
	);
}

export default App;
