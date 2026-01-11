/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use centralized state management and services for better maintainability.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
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

	// React Router hooks
	const navigateTo = useNavigate();
	const location = useLocation();
	const currentRoute = location.pathname + location.search;

	// Simplified routing logic - handle basic navigation based on login state and tournament completion
	useEffect(() => {
		// Small delay to ensure Router context is fully established
		const timeoutId = setTimeout(() => {
			if (!navigateTo) return; // Safety check

			if (!user.isLoggedIn) {
				// Redirect to home if not logged in and not already there
				if (currentRoute !== "/" && !currentRoute.startsWith("/?")) {
					navigateTo("/", { replace: true });
				}
				return;
			}

			// If logged in and on home page, redirect to tournament
			if (currentRoute === "/" || currentRoute === "/?") {
				navigateTo("/tournament", { replace: true });
			}

			// Handle tournament completion - redirect to results
			if (tournament.isComplete && currentRoute === "/tournament") {
				navigateTo("/results", { replace: true });
			}
		}, 0);

		return () => clearTimeout(timeoutId);
	}, [user.isLoggedIn, currentRoute, tournament.isComplete, navigateTo]);

	// Keyboard shortcuts - simplified to just handle analysis toggle
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Analysis mode toggle (Ctrl+Shift+A or Cmd+Shift+A)
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "A") {
				event.preventDefault();

				if (!navigateTo) return; // Safety check

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
			/>
		</ToastProvider>
	);
}

export default App;
