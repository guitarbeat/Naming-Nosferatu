import { MotionConfig, motion } from "framer-motion";
import { RotateCcw, Trophy } from "lucide-react";
import React, {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Iridescence } from "@/components/Iridescence";
import {
	Button,
	ErrorBoundary,
	ErrorComponent,
	Loading,
	Modal,
	OfflineIndicator,
	RouteFallback,
	Section,
} from "@/components/LayoutBlocks";
import { StaggeredMenu } from "@/components/StaggeredMenu";
import { Dashboard as DashboardLazy } from "@/dashboard/Dashboard";
import { usePreloadImages, useSectionScroll } from "@/hooks";
import { scaleFadeMotionPreset } from "@/lib/uiUtils";
import { ErrorManager } from "@/lib/utils";
import { useAuth } from "@/Providers";
import useAppStore, { errorContexts, useAppStoreInitialization } from "@/store";
import { TournamentSetup } from "@/tournament/TournamentSetup";

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
					<h2 className="text-xl font-bold tracking-tight text-foreground">{message}</h2>
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

const LazyProfileInner = lazy(() =>
	import("@/components").then((module) => ({
		default: module.ProfileInner,
	})),
);

export function AppLayout({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();
	const tournament = useAppStore((s) => s.tournament);
	const errors = useAppStore((s) => s.errors);
	const errorActions = useAppStore((s) => s.errorActions);
	const user = useAppStore((s) => s.user);
	const { login, logout } = useAuth();
	const [isProfileOpen, setIsProfileOpen] = useState(false);

	const handleLogin = useCallback(
		async (name: string): Promise<boolean> => {
			const ok = await login({ name });
			if (ok !== false) {
				setIsProfileOpen(false);
			}
			return ok !== false;
		},
		[login],
	);

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
				label: user.isLoggedIn
					? `Profile (${user.name?.split(" ")[0] || "Player"})`
					: "Sign In / Profile",
				onClick: () => setIsProfileOpen(true),
			},
			{
				label: "Admin Dashboard",
				onClick: () => navigate("/admin"),
			},
		],
		[navigate, user.isLoggedIn, user.name],
	);

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full bg-background text-foreground overflow-x-hidden">
				<Iridescence
					color={[1, 1, 1]}
					speed={1.0}
					amplitude={0.1}
					mouseReact={true}
					className="fixed inset-0 z-0 opacity-50 pointer-events-none"
				/>
				<PwaInstallPrompt />

				<OfflineIndicator />
				<StaggeredMenu
					position="right"
					items={staggeredMenuItems}
					displaySocials={false}
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
				<main
					id="main-content"
					className="app-main relative z-10 flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					{Boolean(errors.current) && (
						<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
							<ErrorComponent error={String(errors.current)} onDismiss={handleDismissError} />
						</div>
					)}
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch pb-12 sm:pb-16">
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

				{isProfileOpen && (
					<Modal
						title="Player Profile"
						open={isProfileOpen}
						onClose={() => setIsProfileOpen(false)}
						description="Sign in to save your rankings and track your stats."
					>
						<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
							<LazyProfileInner onLogin={handleLogin} onLogout={logout} />
						</Suspense>
					</Modal>
				)}
			</div>
		</ErrorBoundary>
	);
}

export function HomeRoute() {
	const tournament = useAppStore((s) => s.tournament);
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

	const hasActiveInProgressTournament = Boolean(
		tournament.names && tournament.names.length >= 2 && !tournament.isComplete,
	);

	return (
		<div className="w-full flex flex-col items-center">
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
									<h4 className="text-sm font-semibold text-foreground">Tournament in Progress</h4>
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
									Restart Tournament
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
					Admin access is required to view this page. Return to the home page to sign in.
				</p>
				<Button variant="glass" onClick={() => navigate("/")}>
					Return Home
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
					<Route path="/tournament" element={<Navigate to="/" replace={true} />} />
					<Route path="/analysis" element={<Navigate to="/" replace={true} />} />
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

export function App() {
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
