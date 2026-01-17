/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use declarative React Router routing with centralized auth guards.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./App.module.css";
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, { useAppStoreInitialization } from "./core/store/useAppStore";
// Lazy load route components
import TournamentFlow from "./features/tournament/TournamentFlow";
import { useTournamentHandlers } from "./features/tournament/TournamentHooks";
import UnifiedDashboard from "./features/tournament/UnifiedDashboard";
import { Loading } from "./shared/components/Loading";
import { Toast } from "./shared/components/Toast";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ToastProvider } from "./shared/providers/ToastProvider";
import { ErrorManager } from "./shared/services/errorManager";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils";

/**
 * Root application component with Single Page Architecture (Vertical Scrolling)
 */

interface ToastMessage {
	id: string;
	message: string;
	type: "success" | "error" | "info" | "warning";
}
function App() {
	// Kept for now if needed by hooks, but mostly unused for nav
	const { login, isInitialized } = useUserSession();

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
	const [toasts, setToasts] = useState<ToastMessage[]>([]);
	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

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

	// Tournament handlers - mostly consumed by TournamentFlow now, but kept here for AppLayout props
	const tournamentHandlers = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
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
				>
					<Suspense fallback={<Loading variant="spinner" text="Loading..." />}>
						<div className="flex flex-col gap-8 pb-32">
							{/* Hero / Play Section - Handles Setup, Tournament, and Results */}
							<section id="play" className="min-h-[80vh] flex flex-col justify-center scroll-mt-20">
								<TournamentFlow />
							</section>

							{/* Analysis Section - Only visible after tournament completion */}
							{tournament.isComplete && (
								<section id="analysis" className="min-h-screen pt-16 px-4 scroll-mt-20">
									<h2 className="text-3xl md:text-5xl font-bold mb-12 text-center gradient-text">
										Analyze
									</h2>
									<UnifiedDashboard
										personalRatings={tournament.ratings}
										currentTournamentNames={tournament.names || undefined}
										voteHistory={tournament.voteHistory}
										onStartNew={handleStartNewTournament}
										onUpdateRatings={handleUpdateRatings}
										userName={user.name || ""}
									/>
								</section>
							)}
						</div>
					</Suspense>
				</AppLayout>

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
