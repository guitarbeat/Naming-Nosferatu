/**
 * @module App
 * @description Main application component for the cat name tournament app.
 * Refactored to use declarative React Router routing with centralized auth guards.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { useCallback, useEffect } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { useTournamentHandlers } from "@/features/tournament/hooks/useTournamentHandlers";
import { useOfflineSync } from "@/hooks/useBrowserState";
import { Loading } from "@/layout";
import { AppLayout } from "@/layout/AppLayout";
import { ErrorBoundary } from "@/layout/Error";
import { useAuth } from "@/providers/AuthProvider";
import { AnalysisRoute, HomeRoute } from "@/routes";
import { ErrorManager } from "@/services/errorManager";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";
import {
	cleanupPerformanceMonitoring,
	cn,
	devError,
	initializePerformanceMonitoring,
} from "@/utils/basic";

/**
 * Root application component with Single Page Architecture (Vertical Scrolling)
 */

function App() {
	// Kept for now if needed by hooks, but mostly unused for nav
	const { login, isLoading } = useAuth();
	const isInitialized = !isLoading;

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
	const { user, tournamentActions } = useAppStore();

	// Offline Sync Hook
	useOfflineSync();

	// Tournament handlers - mostly consumed by TournamentFlow now, but kept here for AppLayout props
	const tournamentHandlers = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	const { handleTournamentComplete } = tournamentHandlers;

	// Handle user login
	const handleLogin = useCallback(
		async (userName: string) => {
			try {
				const success = await login({ name: userName });
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
				<Loading variant="spinner" text="Preparing the tournament..." />
			</div>
		);
	}

	return (
		<div
			className={cn("min-h-screen w-full bg-black text-white font-sans selection:bg-purple-500/30")}
		>
			<Routes>
				<Route
					path="/"
					element={
						<AppLayout handleTournamentComplete={handleTournamentComplete}>
							<Outlet />
						</AppLayout>
					}
				>
					<Route
						index={true}
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<ErrorBoundary context="Tournament Flow">
									<HomeRoute onLogin={handleLogin} />
								</ErrorBoundary>
							</div>
						}
					/>
					<Route
						path="analysis"
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<ErrorBoundary context="Analysis Dashboard">
									<AnalysisRoute />
								</ErrorBoundary>
							</div>
						}
					/>
				</Route>
			</Routes>
		</div>
	);
}

export default App;
