/**
 * @module App
 * @description Main application component with consolidated routing and layout.
 * Routes, auth, and layout are now coordinated here.
 *
 * @component
 * @returns {JSX.Element} The complete application UI
 */

import { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { errorContexts, routeComponents } from "@/appConfig";
import { useTournamentHandlers } from "@/features/tournament/hooks/useTournamentHandlers";
import Tournament from "@/features/tournament/Tournament";
import { useAuth } from "@/providers/Providers";
import { ErrorManager } from "@/services/errorManager";
import { AppLayout, Button, ErrorBoundary, Loading, Section } from "@/shared/components";
import { useOfflineSync } from "@/shared/hooks";
import useAppStore, { useAppStoreInitialization } from "@/store/appStore";
import { cn } from "@/utils/basic";
import { cleanupPerformanceMonitoring, initializePerformanceMonitoring } from "@/utils/performance";

const TournamentFlow = routeComponents.TournamentFlow;
const DashboardLazy = routeComponents.DashboardLazy;
const AdminDashboardLazy = routeComponents.AdminDashboardLazy;

function App() {
	const { user: authUser, isLoading } = useAuth();
	const isInitialized = !isLoading;
	const { user, tournamentActions, userActions } = useAppStore();

	// Sync auth user with store
	useEffect(() => {
		if (authUser) {
			userActions.setAdminStatus(authUser.isAdmin);
		}
	}, [authUser, userActions]);

	useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	useEffect(() => {
		initializePerformanceMonitoring();
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanupPerformanceMonitoring();
			cleanup();
		};
	}, []);

	useAppStoreInitialization();
	useOfflineSync();

	if (!isInitialized) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black">
				<Loading variant="spinner" text="Preparing the tournament..." />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"min-h-screen w-full bg-transparent text-white font-sans selection:bg-purple-500/30",
			)}
		>
			<AppLayout>
				<Routes>
					<Route
						path="/"
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<ErrorBoundary context={errorContexts.tournamentFlow}>
									<HomeContent />
								</ErrorBoundary>
							</div>
						}
					/>
					<Route
						path="/tournament"
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<ErrorBoundary context={errorContexts.tournamentFlow}>
									<TournamentContent />
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
					<Route
						path="/admin"
						element={
							<div className="flex flex-col gap-8 pb-[max(8rem,calc(120px+env(safe-area-inset-bottom)))]">
								<AdminContent />
							</div>
						}
					/>
				</Routes>
			</AppLayout>
			<dialog
				id="shared-lightbox-dialog"
				className="backdrop:bg-black/90 bg-transparent p-0 overflow-hidden outline-none"
			/>
		</div>
	);
}

function HomeContent() {
	return (
		<Section id="pick" variant="minimal" padding="comfortable" maxWidth="full">
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				<TournamentFlow />
			</Suspense>
		</Section>
	);
}

function TournamentContent() {
	const { user, tournament, tournamentActions } = useAppStore();
	const { handleTournamentComplete } = useTournamentHandlers({
		userName: user.name,
		tournamentActions,
	});

	return (
		<Section id="tournament" variant="minimal" padding="comfortable" maxWidth="full">
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				{tournament.names && tournament.names.length > 0 ? (
					<Tournament
						names={tournament.names}
						existingRatings={tournament.ratings}
						onComplete={handleTournamentComplete as any}
					/>
				) : (
					<div className="text-center py-20">
						<p className="text-xl text-white/70 mb-4">No names selected for tournament</p>
						<Button variant="gradient" onClick={() => window.history.back()}>
							Go Back
						</Button>
					</div>
				)}
			</Suspense>
		</Section>
	);
}

function AnalysisContent() {
	const { user, tournament, tournamentActions } = useAppStore();
	const { handleStartNewTournament } = useTournamentHandlers({
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
						userName={user.name ?? ""}
						isAdmin={user.isAdmin}
					/>
				</ErrorBoundary>
			</Suspense>
		</Section>
	);
}

function AdminContent() {
	const { user } = useAppStore();

	// Only allow admin users
	if (!user.isAdmin) {
		return (
			<Section id="admin" variant="minimal" padding="comfortable" maxWidth="full">
				<div className="text-center py-20">
					<h2 className="text-3xl font-bold mb-4 text-red-400">Access Denied</h2>
					<p className="text-white/60">Admin access required to view this page.</p>
				</div>
			</Section>
		);
	}

	return (
		<Suspense fallback={<Loading variant="skeleton" height={600} />}>
			<ErrorBoundary context={errorContexts.analysisDashboard}>
				<AdminDashboardLazy />
			</ErrorBoundary>
		</Suspense>
	);
}

export default App;
