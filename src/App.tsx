/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
// * Core state and routing hooks
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

	// Toast state management
	const [toasts, setToasts] = useState<any[]>([]);
	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	// React Router hooks - call at top level (not conditionally or in effects)
	const navigateTo = useNavigate();
	const location = useLocation();

	// Simplified routing logic - handle basic navigation based on login state and tournament completion
	useEffect(() => {
		// Only run navigation logic when Router context is available
		if (!navigateTo || !location) return;

		const _currentRoute = location.pathname + location.search;

		if (!user.isLoggedIn) {
			// Redirect to home if not logged in and not already there
			if (_currentRoute !== "/" && !_currentRoute.startsWith("/?")) {
				navigateTo("/", { replace: true });
			}
			return;
		}

		// If logged in and on home page, redirect to tournament
		if (_currentRoute === "/" || _currentRoute === "/?") {
			navigateTo("/tournament", { replace: true });
		}

		// Handle tournament completion - redirect to results
		if (tournament.isComplete && _currentRoute === "/tournament") {
			navigateTo("/results", { replace: true });
		}
	}, [user.isLoggedIn, tournament.isComplete, navigateTo, location]);

	// Keyboard shortcuts - simplified to just handle analysis toggle
	useEffect(() => {
		// Only set up keyboard shortcuts when Router context is available
		if (!navigateTo || !location) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Analysis mode toggle (Ctrl+Shift+A or Cmd+Shift+A)
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "A") {
				event.preventDefault();

				const searchParams = new URLSearchParams(location.search);
				const hasAnalysis = searchParams.has("analysis");
				if (hasAnalysis) {
					searchParams.delete("analysis");
				} else {
					searchParams.set("analysis", "true");
				}
				const newSearch = searchParams.toString();
				const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
				navigateTo(newPath, { replace: true });
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [location, navigateTo]);

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
	const tournamentHandlers = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
		navigateTo,
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

	// Show loading screen while initializing
	if (!isInitialized) {
		return (
			<div className="fullScreenCenter">
				<Loading variant="spinner" text="Loading..." />
			</div>
		);
	}

	const appClassName = useMemo(() => (user.isLoggedIn ? "app" : "app app--login"), [user.isLoggedIn]);

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
