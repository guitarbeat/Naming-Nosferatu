import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/Providers";
import { hapticNavTap, hapticTournamentStart } from "@/shared/lib/browser/haptics";
import useAppStore from "@/store/appStore";

export type NavSection = "pick" | "tournament" | "analysis";

const keyToId: Record<NavSection, string> = {
	pick: "pick",
	tournament: "tournament",
	analysis: "analysis",
};

export function useFloatingNavbarState() {
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
	const [prefersReducedMotion, _setPrefersReducedMotion] = useState(false);
	const [scrollProgress, setScrollProgress] = useState(0);
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

				const total = document.documentElement.scrollHeight - window.innerHeight;
				setScrollProgress(
					total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0,
				);
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
		if (!isHomeRoute) {
			setScrollProgress(0);
		}
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

	return {
		activeSection,
		isAdmin,
		isAdminRoute,
		isHomeRoute,
		isLoggedIn,
		isNavVisible,
		isProfileOpen,
		isSuggestOpen,
		isSwipeMode,
		isTournamentActive,
		isTournamentRoute,
		avatarUrl,
		profileLabel,
		selectedCount,
		tournamentRatings: tournament.ratings,
		prefersReducedMotion,
		scrollProgress,
		profileButtonRef,
		suggestButtonRef,
		profileOriginRect,
		suggestOriginRect,
		handleAdminClick,
		handleNavClick,
		handleStartTournament,
		openProfileModal,
		openSuggestModal,
		setIsProfileOpen,
		setIsSuggestOpen,
		setSwipeMode,
		login,
		logout,
	};
}
