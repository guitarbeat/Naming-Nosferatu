import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig, motion } from "framer-motion";
import {
	CheckCircle,
	ChevronDown,
	Home,
	Lightbulb,
	Lock,
	PlayCircle,
	RotateCcw,
	Trophy,
	User,
} from "lucide-react";
import React, {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Dashboard as DashboardLazy } from "@/features/dashboard/Dashboard";
import { CatHeroCard } from "@/features/tournament/CatHeroCard";
import { NameSuggestion } from "@/features/tournament/NameSuggestion";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";
import { queryClient } from "@/shared/api";
import { Iridescence } from "@/shared/components/Iridescence";
import {
	Button,
	ErrorBoundary,
	ErrorComponent,
	Loading,
	Modal,
	OfflineIndicator,
	RouteFallback,
	Section,
	SectionHeading,
} from "@/shared/components/LayoutBlocks";
import { StaggeredMenu } from "@/shared/components/StaggeredMenu";
import { usePrefersReducedMotion, usePreloadImages, useSectionScroll } from "@/shared/hooks";
import { scaleFadeMotionPreset } from "@/shared/lib/uiUtils";
import {
	cn,
	ErrorManager,
	handleImgError,
	hapticNavTap,
	hapticTournamentStart,
	setupGlobalImageErrorHandler,
} from "@/shared/lib/utils";
import useAppStore, { errorContexts, useAppStoreInitialization } from "@/store";

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
		console.warn("Sentry not available, continuing without error tracking:", error);
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
							<ErrorComponent error={String(errors.current)} onDismiss={handleDismissError} />
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
			{/* HERO SECTION - integrating previously unused styling classes */}
			<section className="home-hero-section w-full relative flex flex-col justify-center items-center">
				<div className="home-hero-inner w-full flex flex-col lg:flex-row items-center justify-between gap-12 z-10 relative">
					{/* Left Copy Column */}
					<div className="home-hero-copy flex flex-col items-start w-full lg:w-1/2 gap-6 z-10 text-left">
						<h1 className="gradient-heading text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight">
							Name Nosferatu.
						</h1>
					</div>

					{/* Right Graphic Column: Interactive Cat Photo Card */}
					<div className="home-hero-preview relative w-full lg:w-1/2 flex justify-center lg:justify-end items-center z-10">
						<CatHeroCard />
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
					Admin access is required to view this page. Head back home to log in or return to the main
					tournament flow.
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

const keyToId = {
	landing: "pick",
	about: "pick",
	pick: "pick",
	tournament: "pick",
	stats: "analysis",
	analysis: "analysis",
	results: "analysis",
} as const;

type NavSection = keyof typeof keyToId;

interface NavItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	isActive?: boolean;
	isAccent?: boolean;
	hasBadge?: boolean;
	onClick: () => void;
}

const LazyProfileInner = lazy(() =>
	import("@/shared/components").then((module) => ({
		default: module.ProfileInner,
	})),
);

export function FloatingNavbar() {
	const tournament = useAppStore((s) => s.tournament);
	const tournamentActions = useAppStore((s) => s.tournamentActions);
	const user = useAppStore((s) => s.user);
	const navigate = useNavigate();
	const location = useLocation();
	const { login, logout } = useAuth();
	const { selectedNames } = tournament;
	const { isLoggedIn, name: userName, avatarUrl, isAdmin } = user;
	const [activeSection, setActiveSection] = useState<NavSection>("pick");
	const prefersReducedMotion = usePrefersReducedMotion();
	const [pendingScroll, setPendingScroll] = useState<NavSection | null>(null);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isSuggestOpen, setIsSuggestOpen] = useState(false);

	const isHomeRoute = location.pathname === "/";
	const isAdminRoute = location.pathname === "/admin";
	const isTournamentRoute = location.pathname === "/tournament";

	const selectedCount = selectedNames?.length || 0;
	const isTournamentActive = Boolean(
		tournament.names && tournament.names.length >= 2 && !tournament.isComplete,
	);
	const profileLabel = isLoggedIn ? userName?.split(" ")[0] || "Profile" : "Profile";

	const scrollToSection = useCallback(
		(key: NavSection | string) => {
			const id = keyToId[key as NavSection] || key;
			const target = document.getElementById(id) || document.getElementById(key);
			if (!target) {
				window.scrollTo({
					top: 0,
					behavior: prefersReducedMotion ? "auto" : "smooth",
				});
				return;
			}

			target.scrollIntoView({
				behavior: prefersReducedMotion ? "auto" : "smooth",
				block: "start",
			});
		},
		[prefersReducedMotion],
	);

	const handleStartTournament = useCallback(() => {
		hapticTournamentStart();
		if (selectedNames && selectedNames.length >= 2) {
			tournamentActions.setNames(selectedNames);
			window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: "tournament" }));
			if (isHomeRoute) {
				scrollToSection("tournament");
			} else {
				setPendingScroll("tournament");
				navigate("/");
			}
		}
	}, [isHomeRoute, navigate, scrollToSection, selectedNames, tournamentActions]);

	const handleNavClick = useCallback(
		(key: NavSection) => {
			hapticNavTap();
			if (!isHomeRoute) {
				setPendingScroll(key);
				navigate(`/#${key}`);
				return;
			}
			setActiveSection(key);
			scrollToSection(key);
			if (typeof window !== "undefined" && window.history?.replaceState) {
				window.history.replaceState(null, "", `#${key}`);
			}
		},
		[isHomeRoute, navigate, scrollToSection],
	);

	const handleAdminClick = useCallback(() => {
		hapticNavTap();
		if (!isAdminRoute) {
			navigate("/admin");
		}
	}, [isAdminRoute, navigate]);

	const openProfileModal = useCallback(() => {
		hapticNavTap();
		setIsSuggestOpen(false);
		setIsProfileOpen((prev) => !prev);
	}, []);

	const openSuggestModal = useCallback(() => {
		hapticNavTap();
		setIsProfileOpen(false);
		setIsSuggestOpen((prev) => !prev);
	}, []);

	const handleLogin = useCallback(
		async (name: string) => {
			const ok = await login({ name });
			if (ok !== false) {
				setIsProfileOpen(false);
			}
			return ok;
		},
		[login],
	);

	useEffect(() => {
		if (isHomeRoute && location.hash) {
			const hashKey = location.hash.replace("#", "") as NavSection;
			if (hashKey) {
				scrollToSection(hashKey);
			}
		}
	}, [isHomeRoute, location.hash, scrollToSection]);

	useEffect(() => {
		if (!isHomeRoute || !pendingScroll) {
			return;
		}
		scrollToSection(pendingScroll);
		setPendingScroll(null);
	}, [isHomeRoute, pendingScroll, scrollToSection]);

	useEffect(() => {
		const handleTabChange = (e: Event) => {
			const customEvent = e as CustomEvent<NavSection>;
			if (customEvent.detail) {
				setActiveSection(customEvent.detail);
				scrollToSection(customEvent.detail);
			}
		};
		window.addEventListener("nav-tab-change", handleTabChange);
		return () => window.removeEventListener("nav-tab-change", handleTabChange);
	}, [scrollToSection]);

	useEffect(() => {
		if (!isHomeRoute) {
			return;
		}

		let rafId: number | null = null;
		const sections: NavSection[] = ["pick", "analysis"];

		const handleScroll = () => {
			if (rafId) {
				return;
			}
			rafId = requestAnimationFrame(() => {
				rafId = null;
				let current: NavSection | null = null;
				let minDistance = Number.POSITIVE_INFINITY;

				for (const section of sections) {
					const targetId = keyToId[section] || section;
					const element = document.getElementById(targetId) || document.getElementById(section);
					if (!element) {
						continue;
					}
					const rect = element.getBoundingClientRect();
					const distance = Math.abs(rect.top);
					if (distance < minDistance && rect.top < window.innerHeight * 0.7) {
						minDistance = distance;
						current = section;
					}
				}
				if (current) {
					setActiveSection(current);
				}
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
		};
	}, [isHomeRoute]);

	const navItems = useMemo((): NavItem[] => {
		const items: NavItem[] = [];

		if (isHomeRoute) {
			items.push({
				id: "pick",
				label: isTournamentActive
					? "Arena"
					: selectedCount >= 2
						? `Vote (${selectedCount})`
						: "Contenders",
				icon: isTournamentActive ? (
					<PlayCircle className="h-4 w-4" />
				) : selectedCount >= 2 ? (
					<PlayCircle className="h-4 w-4" />
				) : (
					<CheckCircle className="h-4 w-4" />
				),
				isActive: activeSection === "pick" || activeSection === "tournament",
				isAccent: isTournamentActive || selectedCount >= 2,
				onClick: () => {
					if (isTournamentActive) {
						handleNavClick("tournament");
					} else if (selectedCount >= 2) {
						handleStartTournament();
					} else {
						handleNavClick("pick");
					}
				},
			});

			items.push({
				id: "analysis",
				label: "Results",
				icon: <Trophy className="h-4 w-4" />,
				isActive: activeSection === "analysis" || activeSection === "stats",
				hasBadge: Object.keys(tournament.ratings).length > 0 && activeSection !== "analysis",
				onClick: () => handleNavClick("analysis"),
			});
		} else {
			items.push({
				id: "pick",
				label: "Home",
				icon: <Home className="h-4 w-4" />,
				isActive: false,
				onClick: () => {
					hapticNavTap();
					navigate("/");
				},
			});
		}

		items.push({
			id: "suggest",
			label: "Suggest",
			icon: <Lightbulb className="h-4 w-4" />,
			isActive: isSuggestOpen,
			onClick: openSuggestModal,
		});

		if (isAdmin) {
			items.push({
				id: "admin",
				label: "Admin",
				icon: <Lock className="h-4 w-4" />,
				isActive: isAdminRoute,
				onClick: handleAdminClick,
			});
		}

		items.push({
			id: "profile",
			label: profileLabel,
			icon:
				isLoggedIn && avatarUrl ? (
					<img
						src={avatarUrl}
						alt={profileLabel}
						className="h-5 w-5 rounded-full border border-foreground/15 object-cover"
						onError={handleImgError}
					/>
				) : (
					<User
						className={cn(
							"h-4 w-4",
							isLoggedIn && isAdmin && "text-chart-4",
							isLoggedIn && !isAdmin && "text-primary",
						)}
					/>
				),
			isActive: isProfileOpen,
			onClick: openProfileModal,
		});

		return items;
	}, [
		activeSection,
		avatarUrl,
		handleAdminClick,
		handleNavClick,
		handleStartTournament,
		isAdmin,
		isAdminRoute,
		isHomeRoute,
		isLoggedIn,
		isProfileOpen,
		isSuggestOpen,
		isTournamentActive,
		navigate,
		openProfileModal,
		openSuggestModal,
		profileLabel,
		selectedCount,
		tournament.ratings,
	]);

	if (isTournamentRoute) {
		return null;
	}

	return (
		<>
			<nav className="floating-navbar-frame" aria-label="Main Navigation">
				<div className="floating-navbar-shell flex items-center justify-center gap-1 sm:gap-1.5 p-1.5 rounded-full">
					{navItems.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={item.onClick}
							aria-label={item.label}
							aria-current={item.isActive ? "page" : undefined}
							className={cn(
								"floating-nav-button relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-medium cursor-pointer select-none",
								item.isActive && "floating-nav-button--active font-bold",
								item.isAccent && !item.isActive && "floating-nav-button--accent font-bold",
							)}
						>
							<span className="floating-nav-icon flex items-center justify-center">
								{item.icon}
							</span>
							<span className="floating-nav-label whitespace-nowrap">{item.label}</span>
							{item.hasBadge && (
								<span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
							)}
						</button>
					))}
				</div>
			</nav>

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
			{isSuggestOpen && (
				<Modal
					title="Suggest a Cat Name"
					open={isSuggestOpen}
					onClose={() => setIsSuggestOpen(false)}
					description="Suggest a cat name for the tournament bracket."
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<NameSuggestion variant="modal" onClose={() => setIsSuggestOpen(false)} />
					</Suspense>
				</Modal>
			)}
		</>
	);
}
