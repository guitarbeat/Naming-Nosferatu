/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Now uses state-based view switching instead of React Router.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, { useAppStoreInitialization } from "./core/store/useAppStore";
import { Loading } from "./shared/components/Loading";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ToastProvider } from "./shared/providers/ToastProvider";
import { ErrorManager } from "./shared/services/errorManager";
import styles from "./App.module.css";
import { Toast } from "./shared/components/Toast";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils";

/**
 * Root application component with state-based view switching
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

	// Toast state management
	const [toasts, setToasts] = useState<any[]>([]);
	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	// Auto-navigate to results when tournament completes
	useEffect(() => {
		if (user.isLoggedIn && tournament.isComplete && tournament.currentView === "tournament") {
			tournamentActions.setView("results");
		}
	}, [user.isLoggedIn, tournament.isComplete, tournament.currentView, tournamentActions]);

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

	// Tournament handlers - pass setView instead of navigateTo
	const tournamentHandlers = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
		navigateTo: (route: string) => {
			// Map routes to views for backward compatibility
			const routeToView: Record<string, string> = {
				"/": "tournament",
				"/tournament": "tournament",
				"/results": "results",
				"/gallery": "gallery",
				"/analysis": "analysis",
				"/explore": "explore",
			};
			const view = routeToView[route] || "tournament";
			tournamentActions.setView(view as any);
		},
	});

	const {
		handleTournamentComplete,
		handleStartNewTournament,
		handleTournamentSetup,
		handleUpdateRatings,
	} = tournamentHandlers;

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
	const handleCloseSuggestName = useCallback(() => {
		setIsSuggestNameModalOpen(false);
	}, []);

	const appClassName = useMemo(
		() => (user.isLoggedIn ? "app" : "app app--login"),
		[user.isLoggedIn],
	);

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
			<div className={appClassName}>
				<AppLayout
					handleLogin={handleLogin}
					handleStartNewTournament={handleStartNewTournament}
					handleUpdateRatings={handleUpdateRatings}
					handleTournamentSetup={handleTournamentSetup}
					handleTournamentComplete={handleTournamentComplete}
					isSuggestNameModalOpen={isSuggestNameModalOpen}
					onCloseSuggestName={handleCloseSuggestName}
				/>
				<Toast
					variant="container"
					toasts={toasts}
					removeToast={removeToast}
					className={styles.toastContainer}
				/>
			</div>
		</ToastProvider>
	);
}

export default App;
