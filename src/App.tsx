import { MotionConfig } from "framer-motion";
import type React from "react";
import { Suspense, useCallback, useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
	AppBootScreen,
	ErrorBoundary,
	ErrorComponent,
	Iridescence,
	Loading,
	OfflineIndicator,
	PwaInstallPrompt,
	RouteFallback,
	SkipToMainButton,
	TournamentStatusWidget,
} from "@/components";
import { usePreloadImages, useSectionScroll } from "@/hooks";
import { ErrorManager } from "@/lib/utils";
import useAppStore, { useActiveTournamentStatus, useAppStoreInitialization } from "@/store";
import { TournamentSetup } from "@/tournament/TournamentSetup";

const IRIDESCENCE_COLOR: [number, number, number] = [1, 1, 1];

function AppLayout({ children }: { children: React.ReactNode }) {
	const isLoading = useAppStore((s) => s.tournament.isLoading);
	const currentError = useAppStore((s) => s.errors.current);
	const errorActions = useAppStore((s) => s.errorActions);

	const handleDismissError = () => {
		errorActions.clearError();
	};

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence
					color={IRIDESCENCE_COLOR}
					speed={0.8}
					amplitude={0.08}
					mouseReact={true}
					className="fixed inset-0 z-0 opacity-100 pointer-events-none"
				/>
				<PwaInstallPrompt />

				<OfflineIndicator />

				<SkipToMainButton />
				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					{Boolean(currentError) && (
						<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
							<ErrorComponent error={String(currentError)} onDismiss={handleDismissError} />
						</div>
					)}
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch">
						{children}
					</div>
					{isLoading && (
						<div
							className="global-loading-overlay"
							role="status"
							aria-live="polite"
							aria-busy="true"
						>
							<Loading variant="spinner" text="Initializing Tournament..." />
						</div>
					)}
				</main>
			</div>
		</ErrorBoundary>
	);
}

function HomeRoute() {
	const { hasActiveTournament, namesCount } = useActiveTournamentStatus();
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } = useSectionScroll();

	useEffect(() => {
		const handleTabChange = (e: Event) => {
			const customEvent = e as CustomEvent<string>;
			if (customEvent.detail) {
				scrollToSection(customEvent.detail);
			}
		};
		window.addEventListener("nav-tab-change", handleTabChange);
		return () => window.removeEventListener("nav-tab-change", handleTabChange);
	}, [scrollToSection]);

	const handleStartNewTournament = useCallback(() => {
		clearPendingScroll();
		tournamentActions.resetTournament();
		scheduleSectionScroll("pick");
	}, [clearPendingScroll, tournamentActions, scheduleSectionScroll]);

	useEffect(() => clearPendingScroll, [clearPendingScroll]);

	if (hasActiveTournament) {
		return (
			<div className="w-full flex flex-col items-center">
				<div
					id="app-flow"
					className="w-full flex flex-col items-center gap-10 sm:gap-14 py-4 sm:py-6 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto"
				>
					<section id="pick" className="w-full scroll-mt-20 sm:scroll-mt-24">
						<div id="tournament" className="scroll-mt-20 sm:scroll-mt-24" />
						<div id="contenders" className="scroll-mt-20 sm:scroll-mt-24" />
						<TournamentStatusWidget namesCount={namesCount} onRestart={handleStartNewTournament} />
						<div className="w-full min-h-[480px] flex flex-col flex-1">
							<Suspense fallback={<Loading variant="skeleton" height={400} />}>
								<TournamentSetup />
							</Suspense>
						</div>
					</section>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-[100dvh] min-h-[100dvh] flex flex-col relative overflow-hidden">
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				<TournamentSetup />
			</Suspense>
		</div>
	);
}

function AppShell() {
	const { pathname } = useLocation();

	useLayoutEffect(() => {
		if (!pathname) {
			return;
		}
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	}, [pathname]);

	return (
		<MotionConfig reducedMotion="user">
			<AppLayout>
				<Routes>
					<Route
						path="/"
						element={
							<Suspense fallback={<RouteFallback text="Loading home..." />}>
								<HomeRoute />
							</Suspense>
						}
					/>
					<Route path="/tournament" element={<Navigate to="/" replace={true} />} />
					<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
					<Route path="/admin" element={<Navigate to="/" replace={true} />} />
					<Route path="*" element={<Navigate to="/" replace={true} />} />
				</Routes>
			</AppLayout>
		</MotionConfig>
	);
}

export function App() {
	usePreloadImages();

	const isBootLoading = useAppStore((state) => state.ui.isBootLoading);
	const setBootLoading = useAppStore((state) => state.uiActions.setBootLoading);

	useEffect(() => {
		setBootLoading(false);
	}, [setBootLoading]);

	useEffect(() => {
		const cleanup = ErrorManager.setupGlobalErrorHandling();
		return () => {
			cleanup();
		};
	}, []);

	const handleUserContext = useCallback((_name: string) => {
		// No-op user context initialization hook
	}, []);
	useAppStoreInitialization(handleUserContext);

	if (isBootLoading) {
		return <AppBootScreen visible={true} />;
	}

	return (
		<Suspense
			fallback={
				<div className="flex min-h-[100dvh] items-center justify-center bg-background text-foreground">
					Loading...
				</div>
			}
		>
			<AppShell />
		</Suspense>
	);
}
