import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig, motion } from "framer-motion";
import { ChevronDown, RotateCcw, Trophy } from "lucide-react";
import React, {
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
} from "react";
import ReactDOM from "react-dom/client";
import {
	BrowserRouter,
	Navigate,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { Dashboard as DashboardLazy } from "@/features/dashboard/Dashboard";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";
import { queryClient } from "@/shared/api";
import { Iridescence } from "@/shared/components/Iridescence";
import {
	Button,
	ErrorBoundary,
	ErrorComponent,
	Loading,
	OfflineIndicator,
	RouteFallback,
	Section,
	SectionHeading,
} from "@/shared/components/LayoutBlocks";
import { StaggeredMenu } from "@/shared/components/StaggeredMenu";
import { usePreloadImages, useSectionScroll } from "@/shared/hooks";
import { scaleFadeMotionPreset } from "@/shared/lib/uiUtils";
import { ErrorManager, setupGlobalImageErrorHandler } from "@/shared/lib/utils";
import useAppStore, { errorContexts, useAppStoreInitialization } from "@/store";

import { FloatingNavbar } from "./FloatingNavbar";
import { Providers, useAuth } from "./Providers";

import "../index.css";

// Install global image fallback error handler immediately
setupGlobalImageErrorHandler();

function registerServiceWorker(): void {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
		return;
	}

	window.addEventListener(
		"load",
		() => {
			navigator.serviceWorker.register("/sw.js").catch((error) => {
				console.warn("Service worker registration failed:", error);
			});
		},
		{ once: true },
	);
}

registerServiceWorker();

async function initSentry(): Promise<void> {
	if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
		return;
	}

	try {
		const Sentry = await import("@sentry/react");
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			integrations: [
				Sentry.browserTracingIntegration(),
				Sentry.replayIntegration({
					maskAllText: false,
					blockAllMedia: false,
				}),
			],
			tracesSampleRate: 1.0,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			environment: import.meta.env.MODE,
			release: `name-nosferatu@${import.meta.env.VITE_APP_VERSION || "1.0.2"}`,
		});
	} catch (error) {
		console.warn(
			"Sentry not available, continuing without error tracking:",
			error,
		);
	}
}

initSentry();

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<ErrorBoundary
				context="Application Root"
				onError={(error: Error, errorInfo: React.ErrorInfo) => {
					// Sentry will automatically capture this through ErrorManager
					console.error("Application error:", error, errorInfo);
				}}
			>
				<QueryClientProvider client={queryClient}>
					<Providers>
						<BrowserRouter>
							<App />
						</BrowserRouter>
					</Providers>
				</QueryClientProvider>
			</ErrorBoundary>
		</React.StrictMode>,
	);
}

const BOOT_TIMEOUT_FALLBACK_MS = 2500;
const INSTALL_DESCRIPTION =
	"Add Name Nosferatu to your home screen for quick access to cat name tournaments and your rankings.";
const PWA_TINT = "hsl(152, 26%, 42%)";

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible = true,
}: {
	message?: string;
	visible?: boolean;
}) {
	if (!visible) {
		return null;
	}

	return (
		<div
			data-testid="boot-screen"
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground"
		>
			<motion.div
				{...scaleFadeMotionPreset}
				className="flex flex-col items-center space-y-6 px-4 text-center max-w-md"
			>
				<div className="relative flex h-16 w-16 items-center justify-center">
					<div className="absolute h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute h-16 w-16 rounded-full border-4 border-t-primary animate-spin" />
				</div>

				<div className="space-y-2">
					<h2 className="text-xl font-bold tracking-tight text-foreground">
						{message}
					</h2>
					<p className="text-sm text-muted-foreground animate-pulse">
						Please wait a moment while we load the application context...
					</p>
				</div>
			</motion.div>
		</div>
	);
}

/**
 * Cross-browser PWA install dialog (Chromium prompt + Apple share instructions).
 */
export function PwaInstallPrompt() {
	const installRef = React.useRef<PWAInstallElement | null>(null);

	useEffect(() => {
		const element = installRef.current;
		if (!element) {
			return;
		}

		element.manifestUrl = "/manifest.json";
		element.useLocalStorage = true;
		element.installDescription = INSTALL_DESCRIPTION;
		element.styles = { "--tint-color": PWA_TINT };

		const deferred = window.__deferredPwaPrompt;
		if (deferred) {
			element.externalPromptEvent = deferred;
		}
	}, []);

	return <pwa-install ref={installRef} />;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();
	const tournament = useAppStore((s) => s.tournament);
	const errors = useAppStore((s) => s.errors);
	const errorActions = useAppStore((s) => s.errorActions);

	const handleSkipToMain = () => {
		const main = document.getElementById("main-content");
		if (!main) {
			return;
		}
		main.focus();
		main.scrollIntoView({ behavior: "smooth" });
	};

	const handleDismissError = () => {
		errorActions.clearError();
	};

	const staggeredMenuItems = useMemo(
		() => [
			{
				label: "Home",
				onClick: () => navigate("/"),
			},
			{
				label: "Admin Dashboard",
				onClick: () => navigate("/admin"),
			},
		],
		[navigate],
	);

	const socialItems = useMemo(
		() => [
			{
				label: "GitHub",
				link: "https://github.com/google/ai-studio",
			},
			{
				label: "About",
				link: "#",
			},
		],
		[],
	);

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full text-foreground overflow-x-hidden">
				<Iridescence
					color={[1, 0.75, 0.9]}
					speed={0.8}
					amplitude={0.06}
					className="fixed inset-0 z-0 opacity-50"
				/>
				<PwaInstallPrompt />

				<OfflineIndicator />
				<StaggeredMenu
					position="right"
					items={staggeredMenuItems}
					socialItems={socialItems}
					colors={["#FFD6E8", "#FFA3CC", "#FF70B0"]}
					accentColor="#FF70B0"
					menuButtonColor="var(--primary)"
					isFixed={true}
				/>

				<button
					type="button"
					className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:p-4 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background cursor-pointer disabled:cursor-not-allowed"
					onClick={handleSkipToMain}
				>
					Skip to main content
				</button>
				<FloatingNavbar />
				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					{Boolean(errors.current) && (
						<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
							<ErrorComponent
								error={String(errors.current)}
								onDismiss={handleDismissError}
							/>
						</div>
					)}
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch pb-24 sm:pb-28">
						{children}
					</div>
					{tournament.isLoading && (
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

export function HomeRoute() {
	const user = useAppStore((s) => s.user);
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const { scrollToSection, scheduleSectionScroll, clearPendingScroll } =
		useSectionScroll();

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

	const hasActiveInProgressTournament = Boolean(
		tournament.names && tournament.names.length >= 2 && !tournament.isComplete,
	);

	return (
		<div className="w-full flex flex-col items-center">
			{/* HERO SECTION - integrating previously unused styling classes */}
			<section className="home-hero-section w-full relative flex flex-col justify-center items-center">
				<div className="home-hero-inner w-full flex flex-col lg:flex-row items-center justify-between gap-12 z-10 relative">
					{/* Left Copy Column */}
					<div className="home-hero-copy flex flex-col items-start w-full lg:w-1/2 gap-6 z-10 text-left">
						<h1 className="gradient-heading text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight">
							Name Nosferatu.
						</h1>
					</div>

					{/* Right Graphic Column */}
					<div className="home-hero-preview relative w-full lg:w-1/2 flex justify-center lg:justify-end items-center z-10">
						<div className="relative w-full max-w-[500px] aspect-square rounded-[2.5rem] glass-surface glass-surface--fallback p-2 animate-float">
							<div className="relative w-full h-full rounded-[2rem] overflow-hidden">
								<img
									src="/assets/images/ui/cat_graphic_hd.png"
									alt="Nosferatu"
									className="w-full h-full object-cover rounded-[2rem] opacity-90 transition-transform duration-1000 hover:scale-110"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none rounded-[2rem]" />
							</div>
						</div>

						{/* Ambient Glow */}
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10" />
					</div>
				</div>

				<div
					className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary transition-colors z-20"
					onClick={() => scrollToSection("app-flow")}
				>
					<span className="text-xs uppercase tracking-widest font-semibold">
						Scroll to Discover
					</span>
					<ChevronDown className="w-6 h-6 animate-bounce" />
				</div>
			</section>

			<div
				id="app-flow"
				className="w-full flex flex-col items-center gap-10 sm:gap-14 py-4 sm:py-6 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto"
			>
				{/* 1. Pick Contenders / Tournament Arena */}
				<section id="pick" className="w-full scroll-mt-20 sm:scroll-mt-24">
					<div id="tournament" className="scroll-mt-20 sm:scroll-mt-24" />
					<div id="contenders" className="scroll-mt-20 sm:scroll-mt-24" />
					{hasActiveInProgressTournament && (
						<div className="mx-auto mb-6 flex w-full max-w-4xl flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/80 p-3.5 sm:p-4 shadow-sm">
							<div className="flex items-center gap-3 text-left w-full sm:w-auto">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
									<Trophy size={18} />
								</div>
								<div>
									<h4 className="text-sm font-semibold text-foreground">
										Tournament in Progress
									</h4>
									<p className="text-xs text-muted-foreground">
										{tournament.names?.length} contenders seeded
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
								<Button
									variant="ghost"
									size="small"
									onClick={handleStartNewTournament}
									className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
								>
									<RotateCcw size={13} />
									Start Fresh
								</Button>
							</div>
						</div>
					)}
					<div className="w-full min-h-[480px] flex flex-col flex-1">
						<Suspense fallback={<Loading variant="skeleton" height={400} />}>
							<TournamentSetup />
						</Suspense>
					</div>
				</section>

				{/* 2. Results & Leaderboards */}
				<section
					id="analysis"
					className="w-full scroll-mt-20 sm:scroll-mt-24 pt-8 border-t border-border/20"
				>
					<div id="results" className="scroll-mt-20 sm:scroll-mt-24" />
					<div id="stats" className="scroll-mt-20 sm:scroll-mt-24" />
					<SectionHeading
						id="section-heading-analysis"
						title="Results & Leaderboards"
						subtitle="See how all the contenders ranked across tournaments."
					/>
					<div className="w-full mt-4 sm:mt-6">
						<Suspense fallback={<Loading variant="skeleton" height={600} />}>
							<ErrorBoundary context={errorContexts.analysisDashboard}>
								<DashboardLazy
									personalRatings={tournament.ratings}
									currentTournamentNames={tournament.names ?? undefined}
									onStartNew={handleStartNewTournament}
									onUpdateRatings={tournamentActions.setRatings}
									userName={user.name ?? ""}
									isAdmin={user.isAdmin}
									isLoggedIn={user.isLoggedIn}
									avatarUrl={user.avatarUrl}
								/>
							</ErrorBoundary>
						</Suspense>
					</div>
				</section>
			</div>
		</div>
	);
}

function AdminLoading() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-background">
			<Loading variant="skeleton" height={600} />
		</div>
	);
}

function AccessDenied() {
	const navigate = useNavigate();
	return (
		<Section id="admin" maxWidth="md">
			<div className="flex flex-col items-center gap-4 py-10 text-center">
				<h2 className="text-3xl font-bold text-destructive">Access Denied</h2>
				<p className="max-w-md text-muted-foreground">
					Admin access is required to view this page. Head back home to log in
					or return to the main tournament flow.
				</p>
				<Button variant="glass" onClick={() => navigate("/")}>
					Back Home
				</Button>
			</div>
		</Section>
	);
}

export function AdminRoute() {
	const { user: authUser, isLoading: authLoading } = useAuth();

	if (authLoading) {
		return <AdminLoading />;
	}

	if (!authUser?.isAdmin) {
		return <AccessDenied />;
	}

	return (
		<Section id="admin">
			<Suspense fallback={<Loading variant="skeleton" height={600} />}>
				<ErrorBoundary context={errorContexts.analysisDashboard}>
					<DashboardLazy
						isAdmin={authUser?.isAdmin}
						userName={authUser?.name}
						isLoggedIn={authUser?.isLoggedIn}
						avatarUrl={authUser?.avatarUrl}
					/>
				</ErrorBoundary>
			</Suspense>
		</Section>
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
					<Route
						path="/tournament"
						element={<Navigate to="/" replace={true} />}
					/>
					<Route
						path="/analysis"
						element={<Navigate to="/" replace={true} />}
					/>
					<Route
						path="/admin"
						element={
							<Suspense fallback={<RouteFallback text="Loading admin..." />}>
								<AdminRoute />
							</Suspense>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace={true} />} />
				</Routes>
			</AppLayout>
		</MotionConfig>
	);
}

function App() {
	usePreloadImages();

	const { user: authUser, isLoading } = useAuth();
	const isStoreLoggedIn = useAppStore((state) => state.user.isLoggedIn);
	const isBootLoading = useAppStore((state) => state.ui.isBootLoading);

	const userActions = useAppStore((state) => state.userActions);
	const setBootLoading = useAppStore((state) => state.uiActions.setBootLoading);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (authUser) {
			userActions.setUser({
				id: authUser.id,
				name: authUser.name,
				isLoggedIn: true,
				isAdmin: Boolean(authUser.isAdmin),
			});
		} else if (isStoreLoggedIn) {
			userActions.logout();
		}

		setBootLoading(false);
	}, [authUser, isLoading, isStoreLoggedIn, setBootLoading, userActions]);

	useEffect(() => {
		const fallbackTimer = setTimeout(() => {
			setBootLoading(false);
		}, BOOT_TIMEOUT_FALLBACK_MS);

		return () => {
			clearTimeout(fallbackTimer);
		};
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

export default App;
