/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use declarative React Router routing with centralized auth guards.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AppLayout } from "./AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loading } from "./components/Loading";
import { Toast } from "./components/Toast";
import { useTournamentHandlers } from "./features/tournament/TournamentHooks";
import { useOfflineSync } from "./hooks/useBrowserState";
import useUserSession from "./hooks/useUserSession";
import { ErrorManager } from "./services/errorManager";
import useAppStore, { useAppStoreInitialization } from "./store/useAppStore";
import { cleanupPerformanceMonitoring, devError, initializePerformanceMonitoring } from "./utils";
import { cn } from "./utils/cn";

// Lazy load route components
const TournamentFlow = lazy(() => import("./features/tournament/TournamentFlow"));
const Dashboard = lazy(() => import("./features/tournament/Dashboard"));

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

	// Offline Sync Hook
	useOfflineSync();

	// Toast state management
	const [toasts, setToasts] = useState<ToastMessage[]>([]);
	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

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

	// Show loading screen while initializing
	if (!isInitialized) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black">
				<Loading variant="spinner" text="Loading..." />
			</div>
		);
	}

	return (
		<div className={cn("min-h-screen w-full bg-black text-white font-sans selection:bg-purple-500/30", !user.isLoggedIn && "overflow-hidden")}>
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
							<ErrorBoundary context="Tournament Flow">
								<Suspense fallback={<Loading variant="skeleton" height={400} />}>
									<TournamentFlow />
								</Suspense>
							</ErrorBoundary>
						</section>

						{/* Analysis Section - Only visible after tournament completion and if not in gallery mode */}
						{tournament.isComplete && !ui.showGallery && (
							<section id="analysis" className="min-h-screen pt-16 px-4 scroll-mt-20">
								<h2 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
									Analyze
								</h2>
								<ErrorBoundary context="Analysis Dashboard">
									<Suspense fallback={<Loading variant="skeleton" height={600} />}>
										<Dashboard
											personalRatings={tournament.ratings}
											currentTournamentNames={tournament.names || undefined}
											voteHistory={tournament.voteHistory}
											onStartNew={handleStartNewTournament}
											onUpdateRatings={handleUpdateRatings}
											userName={user.name || ""}
										/>
									</Suspense>
								</ErrorBoundary>
							</section>
						)}
					</div>
				</Suspense>
			</AppLayout>

			<Toast
				variant="container"
				toasts={toasts}
				removeToast={removeToast}
				className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-none"
			/>
		</div>
	);
}

export default App;
