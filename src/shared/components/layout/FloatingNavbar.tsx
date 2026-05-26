import {
	BarChart3,
	CheckCircle,
	Layers,
	LayoutGrid,
	Lightbulb,
	Lock,
	Trophy,
	User,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/Providers";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Modal } from "@/shared/components/layout/Modal";
export type DynamicIslandNavItem = {
	id: string;
	label: string;
	level?: number;
	icon?: React.ReactNode;
	isActive?: boolean;
	isAccent?: boolean;
	hasBadge?: boolean;
	ariaLabel?: string;
	ariaPressed?: boolean;
	onClick: () => void;
};

import { hapticNavTap, hapticTournamentStart } from "@/shared/lib/browser/haptics";
import { cn } from "@/shared/lib/utils";
import useAppStore from "@/store/appStore";

function MobileBottomNav({
	items,
	isVisible,
}: {
	items: DynamicIslandNavItem[];
	isVisible: boolean;
}) {
	const topItems = items.filter((i) => i.level === 1).slice(0, 5);

	return (
		<nav
			className={cn(
				"fixed bottom-0 left-0 w-full z-[9998] flex items-center justify-around border-t border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg transition-transform duration-300 sm:hidden",
				isVisible ? "translate-y-0" : "translate-y-full",
			)}
		>
			{topItems.map((item) => {
				const isActive = Boolean(item.isActive);
				return (
					<button
						key={item.id}
						type="button"
						onClick={item.onClick}
						className={cn(
							"flex flex-col items-center justify-center gap-1 px-2 py-1 min-h-[48px] min-w-[48px]",
							item.isAccent && !isActive && "text-primary",
							item.isAccent && isActive && "text-primary",
							!item.isAccent && isActive && "text-foreground",
							!isActive && !item.isAccent && "text-muted-foreground",
						)}
						aria-label={item.ariaLabel ?? item.label}
						aria-current={isActive ? "location" : undefined}
						aria-pressed={typeof item.ariaPressed === "boolean" ? item.ariaPressed : undefined}
					>
						<span className="relative flex shrink-0 items-center justify-center">
							{item.icon}
							{item.hasBadge && (
								<span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
							)}
						</span>
						<span className="text-xs font-medium tracking-tight">{item.label}</span>
					</button>
				);
			})}
		</nav>
	);
}

function DesktopNavbar({
	items,
	isVisible,
}: {
	items: DynamicIslandNavItem[];
	isVisible: boolean;
}) {
	// Include level 1 items and the layout mode switcher to lay them all flat
	const visibleItems = items.filter((i) => i.level === 1 || i.id === "layout-mode");

	return (
		<nav
			aria-label="Primary"
			className={cn(
				"fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-foreground/10 bg-background/90 px-3 py-1.5 shadow-2xl backdrop-blur-md transition-all duration-300",
				isVisible
					? "translate-y-0 opacity-100 scale-100"
					: "translate-y-10 opacity-0 scale-95 pointer-events-none",
			)}
		>
			{visibleItems.map((item) => {
				const isActive = Boolean(item.isActive);
				return (
					<button
						key={item.id}
						type="button"
						onClick={item.onClick}
						className={cn(
							"group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
							item.isAccent && !isActive && "text-primary hover:bg-primary/10",
							item.isAccent && isActive && "bg-primary/20 text-primary",
							!item.isAccent && isActive && "bg-foreground/10 text-foreground",
							!isActive &&
								!item.isAccent &&
								"text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
						)}
						aria-label={item.ariaLabel ?? item.label}
						aria-current={isActive ? "location" : undefined}
						aria-pressed={typeof item.ariaPressed === "boolean" ? item.ariaPressed : undefined}
					>
						<span className="relative flex shrink-0 items-center justify-center">
							{item.icon}
							{item.hasBadge && (
								<span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
							)}
						</span>
						<span>{item.label}</span>
					</button>
				);
			})}
		</nav>
	);
}

type NavSection = "pick" | "tournament" | "analysis";

const keyToId: Record<NavSection, string> = {
	pick: "pick",
	tournament: "tournament",
	analysis: "analysis",
};

const LazyProfileInner = lazy(() =>
	import("@/shared/components/profile/ProfileInner").then((module) => ({
		default: module.ProfileInner,
	})),
);

const LazyNameSuggestion = lazy(() =>
	import("@/features/tournament/components/NameSuggestion").then((module) => ({
		default: module.NameSuggestion,
	})),
);

export function FloatingNavbar() {
	const appStore = useAppStore();
	const navigate = useNavigate();
	const location = useLocation();
	const { login, logout } = useAuth();
	const { tournament, tournamentActions, user, ui, uiActions } = appStore;
	const { selectedNames } = tournament;
	const { isLoggedIn, name: userName, avatarUrl, isAdmin } = user;
	const { isSwipeMode } = ui;
	const { setSwipeMode } = uiActions;
	const [activeSection, setActiveSection] = useState<NavSection>("pick");
	const [isNavVisible, setIsNavVisible] = useState(true);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const [pendingScroll, setPendingScroll] = useState<NavSection | null>(null);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isSuggestOpen, setIsSuggestOpen] = useState(false);
	const profileButtonRef = useRef<HTMLDivElement | null>(null);
	const suggestButtonRef = useRef<HTMLDivElement | null>(null);
	const [profileOriginRect, setProfileOriginRect] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);
	const [suggestOriginRect, setSuggestOriginRect] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	const isHomeRoute = location.pathname === "/";
	const isAdminRoute = location.pathname === "/admin";
	const isTournamentRoute = location.pathname === "/tournament";
	const [isPastHero, setIsPastHero] = useState(false);

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
			scrollToSection(key);
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
		const buttonEl = profileButtonRef.current;
		if (buttonEl) {
			const rect = buttonEl.getBoundingClientRect();
			setProfileOriginRect({
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			});
		}
		setIsProfileOpen(true);
	}, []);

	const openSuggestModal = useCallback(() => {
		hapticNavTap();
		const buttonEl = suggestButtonRef.current;
		if (buttonEl) {
			const rect = buttonEl.getBoundingClientRect();
			setSuggestOriginRect({
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height,
			});
		}
		setIsSuggestOpen(true);
	}, []);

	useEffect(() => {
		if (!isHomeRoute || !pendingScroll) {
			return;
		}
		scrollToSection(pendingScroll);
		setPendingScroll(null);
	}, [isHomeRoute, pendingScroll, scrollToSection]);

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
				let current: NavSection = "pick";
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
				setActiveSection(current);
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

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
		updatePreference();
		mediaQuery.addEventListener("change", updatePreference);
		return () => mediaQuery.removeEventListener("change", updatePreference);
	}, []);

	useEffect(() => {
		if (!isHomeRoute) {
			setIsPastHero(true);
			return;
		}
		const check = () => {
			setIsPastHero(window.scrollY > window.innerHeight * 0.85);
		};
		check();
		window.addEventListener("scroll", check, { passive: true });
		return () => {
			window.removeEventListener("scroll", check);
			setIsPastHero(false);
		};
	}, [isHomeRoute]);

	useEffect(() => {
		let lastScrollY = window.scrollY;
		let ticking = false;
		const mobileMediaQuery = window.matchMedia("(max-width: 768px)");

		const onScroll = () => {
			if (!mobileMediaQuery.matches) {
				lastScrollY = window.scrollY;
				return;
			}

			if (ticking) {
				return;
			}

			ticking = true;
			requestAnimationFrame(() => {
				const currentScrollY = window.scrollY;
				const delta = currentScrollY - lastScrollY;

				if (delta > 12) {
					setIsNavVisible(false);
				} else if (delta < -12) {
					setIsNavVisible(true);
				}

				lastScrollY = currentScrollY;
				ticking = false;
			});
		};

		const onViewportChange = () => {
			if (!mobileMediaQuery.matches) {
				setIsNavVisible(true);
			}
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		mobileMediaQuery.addEventListener("change", onViewportChange);

		return () => {
			window.removeEventListener("scroll", onScroll);
			mobileMediaQuery.removeEventListener("change", onViewportChange);
		};
	}, []);

	const navItems = useMemo((): DynamicIslandNavItem[] => {
		const items: DynamicIslandNavItem[] = [];

		if (isHomeRoute) {
			items.push({
				id: "pick",
				label: isTournamentActive
					? "Tournament"
					: selectedCount >= 2
						? `Start (${selectedCount})`
						: "Pick Names",
				level: 1,
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
				label: "Analyze",
				level: 1,
				icon: <BarChart3 className="h-4 w-4" />,
				isActive: activeSection === "analysis",
				hasBadge: Object.keys(tournament.ratings).length > 0 && activeSection !== "analysis",
				onClick: () => handleNavClick("analysis"),
			});
		}

		items.push({
			id: "suggest",
			label: "Suggest",
			level: isHomeRoute ? 1 : 1,
			icon: <Lightbulb className="h-4 w-4" />,
			isActive: isSuggestOpen,
			onClick: openSuggestModal,
		});

		if (isAdmin) {
			items.push({
				id: "admin",
				label: "Admin",
				level: 1,
				icon: <Lock className="h-4 w-4" />,
				isActive: isAdminRoute,
				onClick: handleAdminClick,
			});
		}

		items.push({
			id: "profile",
			label: profileLabel,
			level: 1,
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

		if (isHomeRoute) {
			items.push({
				id: "layout-mode",
				label: isSwipeMode ? "Swipe mode" : "Grid mode",
				level: 2,
				icon: isSwipeMode ? <Layers className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />,
				ariaLabel: isSwipeMode ? "Swipe mode active" : "Grid mode active",
				ariaPressed: isSwipeMode,
				onClick: () => {
					hapticNavTap();
					setSwipeMode(!isSwipeMode);
				},
			});
		}

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
		isSwipeMode,
		isTournamentActive,
		openProfileModal,
		openSuggestModal,
		profileLabel,
		selectedCount,
		setSwipeMode,
		tournament.ratings,
	]);

	if (isTournamentRoute) {
		return null;
	}

	const shouldShow = isNavVisible && (!isHomeRoute || isPastHero);

	return (
		<>
			<div ref={profileButtonRef} className="sr-only" aria-hidden="true" />
			<div ref={suggestButtonRef} className="sr-only" aria-hidden="true" />

			<div className="hidden sm:block">
				<DesktopNavbar items={navItems} isVisible={shouldShow} />
			</div>

			<MobileBottomNav items={navItems} isVisible={shouldShow} />

			{isProfileOpen && (
				<Modal
					title="Your Profile"
					hideTitle={true}
					open={isProfileOpen}
					onClose={() => setIsProfileOpen(false)}
					maxWidth="max-w-md"
					description="Sign in to save your rankings."
					originRect={profileOriginRect}
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyProfileInner
							onLogin={async (name) => {
								const ok = await login({ name });
								if (ok !== false) {
									setIsProfileOpen(false);
								}
								return ok;
							}}
							onLogout={logout}
						/>
					</Suspense>
				</Modal>
			)}
			{isSuggestOpen && (
				<Modal
					title="Suggest a Name"
					hideTitle={true}
					open={isSuggestOpen}
					onClose={() => setIsSuggestOpen(false)}
					maxWidth="max-w-md"
					description="Suggest a cat name."
					originRect={suggestOriginRect}
				>
					<Suspense fallback={<Loading variant="card-skeleton" height={260} />}>
						<LazyNameSuggestion variant="modal" onClose={() => setIsSuggestOpen(false)} />
					</Suspense>
				</Modal>
			)}
		</>
	);
}
