/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use declarative React Router routing with centralized auth guards.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, { useAppStoreInitialization } from "./core/store/useAppStore";
import { Loading } from "./shared/components/Loading";
import { Toast } from "./shared/components/Toast";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ToastProvider } from "./shared/providers/ToastProvider";
import { ErrorManager } from "./shared/services/errorManager";
import styles from "./App.module.css";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils";

// Lazy load route components
const TournamentFlow = lazy(() => import("./features/tournament/TournamentFlow").then(module => ({ default: module.TournamentFlow })));
const GalleryView = lazy(() => import("./features/gallery/GalleryView"));
const Explore = lazy(() => import("./features/explore/Explore"));
const Dashboard = lazy(() => import("./features/tournament/TournamentDashboard").then(m => ({ default: m.TournamentDashboard })));

/**
 * Root application component with Single Page Architecture (Vertical Scrolling)
 */
function App() {
	const navigate = useNavigate(); // Kept for now if needed by hooks, but mostly unused for nav
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
		navigateTo: navigate,
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
					onOpenSuggestName={() => setIsSuggestNameModalOpen(true)}
				>
					<Suspense fallback={<Loading variant="spinner" text="Loading..." />}>
						<div className="flex flex-col gap-8 pb-32">
							{/* Hero / Play Section - Handles Setup, Tournament, and Results */}
							<section id="play" className="min-h-[80vh] flex flex-col justify-center scroll-mt-20">
								<TournamentFlow />
							</section>

							{/* Gallery Section */}
							<section id="gallery" className="min-h-screen pt-16 px-4 scroll-mt-20">
								<h2 className="text-3xl md:text-5xl font-bold mb-12 text-center gradient-text">Collection</h2>
								<GalleryView />
							</section>

							{/* Explore Section */}
							<section id="explore" className="min-h-screen pt-16 px-4 scroll-mt-20">
								<h2 className="text-3xl md:text-5xl font-bold mb-12 text-center gradient-text">Explore</h2>
								<Explore userName={user.name || ""} />
							</section>

							{/* Analysis Section - Always rendered, visible via scroll */}
							<section id="analysis" className="min-h-screen pt-16 px-4 scroll-mt-20">
								<h2 className="text-3xl md:text-5xl font-bold mb-12 text-center gradient-text">Global Insights</h2>
								<Dashboard
									personalRatings={
										tournament.isComplete && tournament.names !== null
											? Object.fromEntries(
												Object.entries(tournament.ratings).map(([key, value]) => [
													key,
													typeof value === "object" && value !== null && "rating" in value
														? value.rating
														: typeof value === "number"
															? value
															: 0,
												]),
											)
											: undefined
									}
									currentTournamentNames={
										tournament.isComplete && tournament.names !== null
											? tournament.names
											: undefined
									}
									voteHistory={tournament.isComplete ? tournament.voteHistory : undefined}
									onStartNew={handleStartNewTournament}
									onUpdateRatings={handleUpdateRatings as any}
									userName={user.name || ""}
									mode="global"
								/>
							</section>
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
