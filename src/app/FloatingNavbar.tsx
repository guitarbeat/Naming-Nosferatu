import {
	CheckCircle,
	Home,
	Lightbulb,
	Lock,
	PlayCircle,
	Trophy,
	User,
} from "lucide-react";
import type React from "react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { NameSuggestion } from "@/features/tournament/NameSuggestion";
import { Loading, Modal } from "@/shared/components/LayoutBlocks";
import { usePrefersReducedMotion } from "@/shared/hooks";
import {
	cn,
	handleImgError,
	hapticNavTap,
	hapticTournamentStart,
} from "@/shared/lib/utils";
import useAppStore from "@/store";
import { useAuth } from "./Providers";

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
	const profileLabel = isLoggedIn
		? userName?.split(" ")[0] || "Profile"
		: "Profile";

	const scrollToSection = useCallback(
		(key: NavSection | string) => {
			const id = keyToId[key as NavSection] || key;
			const target =
				document.getElementById(id) || document.getElementById(key);
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
			window.dispatchEvent(
				new CustomEvent("nav-tab-change", { detail: "tournament" }),
			);
			if (isHomeRoute) {
				scrollToSection("tournament");
			} else {
				setPendingScroll("tournament");
				navigate("/");
			}
		}
	}, [
		isHomeRoute,
		navigate,
		scrollToSection,
		selectedNames,
		tournamentActions,
	]);

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
					const element =
						document.getElementById(targetId) ||
						document.getElementById(section);
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
				hasBadge:
					Object.keys(tournament.ratings).length > 0 &&
					activeSection !== "analysis",
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
								item.isAccent &&
									!item.isActive &&
									"floating-nav-button--accent font-bold",
							)}
						>
							<span className="floating-nav-icon flex items-center justify-center">
								{item.icon}
							</span>
							<span className="floating-nav-label whitespace-nowrap">
								{item.label}
							</span>
							{item.hasBadge && (
								<span
									className="size-2 rounded-full bg-primary animate-pulse"
									aria-hidden="true"
								/>
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
						<NameSuggestion
							variant="modal"
							onClose={() => setIsSuggestOpen(false)}
						/>
					</Suspense>
				</Modal>
			)}
		</>
	);
}
