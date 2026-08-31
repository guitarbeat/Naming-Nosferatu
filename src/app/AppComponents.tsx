import { motion } from "framer-motion";
import { BarChart3, CheckCircle, Lightbulb, Lock, Trophy, User } from "lucide-react";
import type { ReactNode } from "react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/Providers";
import { NameSuggestion } from "@/features/tournament/TournamentSetup";
import {
	ErrorBoundary,
	ErrorComponent,
	FloatingNav,
	Loading,
	Modal,
	type NavItem,
	OfflineIndicator,
} from "@/shared/components";
import { usePrefersReducedMotion } from "@/shared/hooks";
import { scaleFadeMotionPreset } from "@/shared/lib/uiUtils";
import { cn, hapticNavTap, hapticTournamentStart } from "@/shared/lib/utils";
import useAppStore from "@/store";

const INSTALL_DESCRIPTION =
	"Add Name Nosferatu to your home screen for quick access to cat name tournaments and your rankings.";

interface AppBootScreenProps {
	message?: string;
	visible?: boolean;
}

export function AppBootScreen({
	message = "Preparing the tournament...",
	visible = true,
}: AppBootScreenProps) {
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
				{/* Elegant Spinner */}
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

const PWA_TINT = "hsl(152, 26%, 42%)";

/**
 * Cross-browser PWA install dialog (Chromium prompt + Apple share instructions).
 * @see https://github.com/khmyznikov/pwa-install
 */
export function PwaInstallPrompt() {
	const installRef = useRef<PWAInstallElement | null>(null);

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

const keyToId = {
	landing: "landing-hero",
	about: "about-section",
	pick: "pick-names-section",
	tournament: "tournament-section",
	stats: "stats-section",
	analysis: "stats-section",
} as const;

type NavSection = keyof typeof keyToId;

// Dynamic Import for Search/Suggest Modal content

const LazyProfileInner = lazy(() =>
	import("@/shared/components").then((module) => ({
		default: module.ProfileInner,
	})),
);

const _SuggestModalContent = lazy(() =>
	import("@/shared/components").then((_module) => ({
		default: NameSuggestion, // fallback
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
	const isTournamentActive = Boolean(tournament.names);
	const profileLabel = isLoggedIn ? userName?.split(" ")[0] || "Profile" : "Profile";

	const scrollToSection = useCallback(
		(key: NavSection) => {
			const id = keyToId[key];
			const target = document.getElementById(id);
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
				navigate("/");
				return;
			}
			setActiveSection(key);
			window.dispatchEvent(new CustomEvent("nav-tab-change", { detail: key }));
		},
		[isHomeRoute, navigate],
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
		if (!isHomeRoute || !pendingScroll) {
			return;
		}
		scrollToSection(pendingScroll);
		setPendingScroll(null);
	}, [isHomeRoute, pendingScroll, scrollToSection]);

	useEffect(() => {
		const handleTabChange = (e: Event) => {
			const customEvent = e as CustomEvent<NavSection>;
			setActiveSection(customEvent.detail);
		};
		window.addEventListener("nav-tab-change", handleTabChange);
		return () => window.removeEventListener("nav-tab-change", handleTabChange);
	}, []);

	useEffect(() => {
		if (!isHomeRoute) {
			return;
		}

		let rafId: number | null = null;
		const sections: NavSection[] = ["pick", "tournament", "analysis"];

		const handleScroll = () => {
			if (rafId) {
				return;
			}
			rafId = requestAnimationFrame(() => {
				rafId = null;
				let current: NavSection | null = null;
				let minDistance = Number.POSITIVE_INFINITY;

				for (const section of sections) {
					const element = document.getElementById(section);
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
					? "Compare"
					: selectedCount >= 2
						? `Vote (${selectedCount})`
						: "Favorites",
				icon: isTournamentActive ? (
					<Trophy className="h-4 w-4" />
				) : selectedCount >= 2 ? (
					<Trophy className="h-4 w-4" />
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
				icon: <BarChart3 className="h-4 w-4" />,
				isActive: activeSection === "analysis",
				hasBadge: Object.keys(tournament.ratings).length > 0 && activeSection !== "analysis",
				onClick: () => handleNavClick("analysis"),
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
			<FloatingNav items={navItems} />

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

interface AppLayoutProps {
	children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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

	return (
		<ErrorBoundary context="Main Application Layout">
			<div className="app relative min-h-dvh w-full text-foreground">
				<div className="app-ambient" aria-hidden="true" />
				<PwaInstallPrompt />
				<OfflineIndicator />

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
					className="app-main relative flex w-full flex-col pt-0"
					tabIndex={-1}
				>
					{Boolean(errors.current) && (
						<div className="mx-auto mb-4 w-full max-w-4xl px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
							<ErrorComponent error={String(errors.current)} onDismiss={handleDismissError} />
						</div>
					)}
					<div className="app-main__content flex w-full flex-1 flex-col items-stretch">
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
