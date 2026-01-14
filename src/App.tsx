/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use declarative React Router routing with centralized auth guards.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./shared/components/PageTransition";
import { useTournamentHandlers } from "./core/hooks/tournamentHooks";
import useUserSession from "./core/hooks/useUserSession";
import useAppStore, { useAppStoreInitialization } from "./core/store/useAppStore";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { Loading } from "./shared/components/Loading";
import { AppLayout } from "./shared/layouts/AppLayout";
import { ToastProvider } from "./shared/providers/ToastProvider";
import { ErrorManager } from "./shared/services/errorManager";
import { Toast } from "./shared/components/Toast";
import styles from "./App.module.css";
import {
	cleanupPerformanceMonitoring,
	devError,
	initializePerformanceMonitoring,
} from "./shared/utils";

// Lazy load route components
const TournamentSetup = lazy(() => import("./features/tournament/components/TournamentSetup"));
const Tournament = lazy(() => import("./features/tournament/Tournament"));
const Dashboard = lazy(() => import("./features/tournament/Dashboard"));
const GalleryView = lazy(() => import("./features/gallery/GalleryView"));
const Explore = lazy(() => import("./features/explore/Explore"));

/**
 * Root application component with declarative React Router routing
 */
function App() {
	const navigate = useNavigate();
	const location = useLocation();
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

	// Tournament handlers - use React Router navigate
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
				>
					<Suspense fallback={<Loading variant="spinner" text="Loading..." />}>
						<AnimatePresence mode="wait">
							<PageTransition key={location.pathname}>
								<Routes location={location}>
									{/* Public routes */}
									<Route
										path="/"
										element={
											user.isLoggedIn ? (
												<Navigate to="/tournament" replace />
											) : (
												<TournamentSetup
													onLogin={handleLogin}
													onStart={handleTournamentSetup}
													userName={user.name}
													isLoggedIn={false}
													existingRatings={{}}
												/>
											)
										}
									/>

									{/* Protected routes - require authentication */}
									<Route element={<ProtectedRoute />}>
										{/* Tournament routes */}
										<Route
											path="/tournament"
											element={
												tournament.names === null ? (
													<TournamentSetup
														onLogin={handleLogin}
														onStart={handleTournamentSetup}
														userName={user.name}
														isLoggedIn={user.isLoggedIn}
														existingRatings={Object.fromEntries(
															Object.entries(tournament.ratings).map(
																([key, value]) => [
																	key,
																	typeof value === "object" &&
																		value !== null &&
																		"rating" in value
																		? value.rating
																		: typeof value === "number"
																			? value
																			: 0,
																],
															),
														)}
													/>
												) : (
													<Tournament
														names={tournament.names}
														existingRatings={Object.fromEntries(
															Object.entries(tournament.ratings).map(
																([key, value]) => [
																	key,
																	typeof value === "object" &&
																		value !== null &&
																		"rating" in value
																		? value.rating
																		: typeof value === "number"
																			? value
																			: 0,
																],
															),
														)}
														onComplete={async (ratings: Record<string, number>) => {
															const convertedRatings = Object.fromEntries(
																Object.entries(ratings).map(([key, value]) => [
																	key,
																	{ rating: value },
																]),
															);
															return handleTournamentComplete(
																convertedRatings,
															);
														}}
														userName={user.name}
														onVote={(vote: unknown) =>
															tournamentActions.addVote(
																vote as import("./types/components").VoteData,
															)
														}
													/>
												)
											}
										/>

										{/* Results route - tournament must be complete */}
										<Route
											path="/results"
											element={
												tournament.isComplete && tournament.names !== null ? (
													<Dashboard
														personalRatings={Object.fromEntries(
															Object.entries(tournament.ratings).map(
																([key, value]) => [
																	key,
																	typeof value === "object" &&
																		value !== null &&
																		"rating" in value
																		? value.rating
																		: typeof value === "number"
																			? value
																			: 0,
																],
															),
														)}
														currentTournamentNames={tournament.names}
														voteHistory={tournament.voteHistory}
														onStartNew={handleStartNewTournament}
														onUpdateRatings={handleUpdateRatings as any}
														userName={user.name || ""}
														mode="personal"
													/>
												) : (
													<Navigate to="/tournament" replace />
												)
											}
										/>

										{/* Analysis route - always shows global data */}
										<Route
											path="/analysis"
											element={
												<Dashboard
													personalRatings={
														tournament.isComplete && tournament.names !== null
															? Object.fromEntries(
																Object.entries(tournament.ratings).map(
																	([key, value]) => [
																		key,
																		typeof value === "object" &&
																			value !== null &&
																			"rating" in value
																			? value.rating
																			: typeof value === "number"
																				? value
																				: 0,
																	],
																),
															)
															: undefined
													}
													currentTournamentNames={
														tournament.isComplete && tournament.names !== null
															? tournament.names
															: undefined
													}
													voteHistory={
														tournament.isComplete
															? tournament.voteHistory
															: undefined
													}
													onStartNew={handleStartNewTournament}
													onUpdateRatings={handleUpdateRatings as any}
													userName={user.name || ""}
													mode="global"
												/>
											}
										/>

										{/* Gallery route */}
										<Route path="/gallery" element={<GalleryView />} />

										{/* Explore route */}
										<Route path="/explore" element={<Explore userName={user.name || ""} />} />
									</Route>

									{/* Catch-all - redirect to home */}
									<Route path="*" element={<Navigate to="/" replace />} />
								</Routes>
							</PageTransition>
						</AnimatePresence>
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
