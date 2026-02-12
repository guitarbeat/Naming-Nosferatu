/**
 * @module App
 * @description Main application component with consolidated routing and layout.
 * Routes, auth, and layout are now coordinated here.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { Suspense, useCallback, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { errorContexts, routeComponents } from "@/appConfig";
import { ProfileSection } from "@/features/tournament/components/ProfileSection";
import { useTournamentHandlers } from "@/features/tournament/hooks/useTournamentHandlers";
import { useOfflineSync } from "@/hooks/useBrowserState";
import { AppLayout } from "@/layout/AppLayout";
import { ErrorBoundary, Loading } from "@/layout/FeedbackComponents";
import { Section } from "@/layout/Section";
import { useAuth } from "@/providers/Providers";
import { ErrorManager } from "@/services/errorManager";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";
import { cn, devError } from "@/utils/basic";
import { cleanupPerformanceMonitoring, initializePerformanceMonitoring } from "@/utils/performance";

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;

function App() {
	const { login, isLoading } = useAuth();
	const isInitialized = !isLoading;

	useEffect(() => {
		initializePerformanceMonitoring();
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanupPerformanceMonitoring();
			cleanup();
		};
	}, []);

	useAppStoreInitialization();
	const { user, tournamentActions } = useAppStore();
	useOfflineSync();

	const tournamentHandlers = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

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
			<AppLayout handleTournamentComplete={tournamentHandlers.handleTournamentComplete}>
				<Routes>
					<Route
						path="/"
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<ErrorBoundary context={errorContexts.tournamentFlow}>
									<HomeContent onLogin={handleLogin} />
								</ErrorBoundary>
							</div>
						}
					/>
					<Route
						path="/analysis"
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<AnalysisContent />
							</div>
						}
					/>
				</Routes>
			</AppLayout>
		</div>
	);
}

function HomeContent({ onLogin }: { onLogin: (name: string) => Promise<boolean | undefined> }) {
	return (
		<>
			<div id="pick" className="absolute -top-20" />
			<Section id="play" variant="minimal" padding="comfortable" maxWidth="full">
				<Suspense fallback={<Loading variant="skeleton" height={400} />}>
					<TournamentFlow />
				</Suspense>
			</Section>
			<ProfileSection onLogin={onLogin} />
		</>
	);
}

function AnalysisContent() {
	const { user, tournament, tournamentActions } = useAppStore();
	const { handleStartNewTournament, handleUpdateRatings } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	return (
		<Section id="analysis" variant="minimal" padding="comfortable" maxWidth="full">
			<h2 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
				The Victors Emerge
			</h2>
			<Suspense fallback={<Loading variant="skeleton" height={600} />}>
				<ErrorBoundary context={errorContexts.analysisDashboard}>
					<DashboardLazy
						personalRatings={tournament.ratings}
						currentTournamentNames={tournament.names ?? undefined}
						onStartNew={handleStartNewTournament}
						onUpdateRatings={handleUpdateRatings}
						userName={user.name ?? ""}
					/>
				</ErrorBoundary>
			</Suspense>
		</Section>
	);
}

export default App;
