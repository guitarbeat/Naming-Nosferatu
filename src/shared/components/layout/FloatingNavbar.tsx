import type { ElementType, ReactNode } from "react";
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/Providers";
import { Modal } from "@/shared/components/layout/Modal";
import { Loading } from "@/shared/components/layout/Feedback";
import { cn } from "@/shared/lib/utils";
import {
        hapticNavTap,
        hapticTournamentStart,
} from "@/shared/lib/browser/haptics";
import {
        BarChart3,
        CheckCircle,
        Layers,
        LayoutGrid,
        Lightbulb,
        Lock,
        Trophy,
        User,
} from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";
import { getGlassPreset } from "./GlassPresets";
import LiquidGlass from "./LiquidGlass";

type NavSection = "pick" | "tournament" | "analysis" | "suggest";

const keyToId: Record<NavSection, string> = {
        pick: "pick",
        tournament: "tournament",
        analysis: "analysis",
        suggest: "suggest",
};

const LazyProfileInner = lazy(() =>
        import("@/shared/components/profile/ProfileInner").then((module) => ({
                default: module.ProfileInner,
        })),
);

function FloatingNavItem({
        icon: Icon,
        label,
        variant = "primary",
        isCurrent = false,
        isPressed = false,
        isAccent = false,
        onClick,
        customIcon,
        className,
        ariaLabel,
}: {
        icon: ElementType;
        label: string;
        variant?: "primary" | "utility";
        isCurrent?: boolean;
        isPressed?: boolean;
        isAccent?: boolean;
        onClick: () => void;
        customIcon?: ReactNode;
        className?: string;
        ariaLabel?: string;
}) {
        return (
                <button
                        type="button"
                        className={cn(
                                "floating-navbar__item",
                                "motion-safe:duration-200 motion-safe:ease-out active:scale-[0.98]",
                                variant === "utility"
                                        ? "floating-navbar__item--utility"
                                        : "floating-navbar__item--primary",
                                isAccent && "floating-navbar__item--accent",
                                className,
                        )}
                        onClick={onClick}
                        aria-current={variant === "primary" && isCurrent ? "location" : undefined}
                        aria-pressed={variant === "utility" ? isPressed : undefined}
                        aria-label={ariaLabel ?? label}
                >
                        <span className="floating-navbar__icon" aria-hidden="true">
                                {customIcon || <Icon className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </span>
                        <span
                                className={cn(
                                        "floating-navbar__label",
                                        variant === "utility" && "floating-navbar__label--utility",
                                )}
                        >
                                {label}
                        </span>
                </button>
        );
}

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
        const [_isMobile, setIsMobile] = useState(false);
        const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
        const [pendingScroll, setPendingScroll] = useState<NavSection | null>(null);
        const [isProfileOpen, setIsProfileOpen] = useState(false);
        const profileButtonRef = useRef<HTMLDivElement | null>(null);
        const [profileOriginRect, setProfileOriginRect] = useState<
                { x: number; y: number; width: number; height: number } | null
        >(null);
        const navGlassId = useId();

        const isHomeRoute = location.pathname === "/";
        const isAdminRoute = location.pathname === "/admin";
        const isTournamentRoute = location.pathname === "/tournament";
        const [isPastHero, setIsPastHero] = useState(false);

        const selectedCount = selectedNames?.length || 0;
        const isTournamentActive = Boolean(tournament.names);
        const profileLabel = isLoggedIn
                ? userName?.split(" ")[0] || "Profile"
                : "Profile";
        const primaryItemCount = isAdmin ? 5 : 4;

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

        const handleStartTournament = () => {
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
        };

        const handleNavClick = (key: NavSection) => {
                hapticNavTap();
                if (!isHomeRoute) {
                        setPendingScroll(key);
                        navigate("/");
                        return;
                }
                scrollToSection(key);
        };

        const handleAdminClick = () => {
                hapticNavTap();
                if (!isAdminRoute) {
                        navigate("/admin");
                }
        };

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
                const sections: NavSection[] = [
                        "pick",
                        "tournament",
                        "analysis",
                        "suggest",
                        "profile",
                ];

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
                let isCurrentlyMobile = mobileMediaQuery.matches;

                setIsMobile(isCurrentlyMobile);

                const onScroll = () => {
                        if (!isCurrentlyMobile) {
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
                        isCurrentlyMobile = mobileMediaQuery.matches;
                        setIsMobile(isCurrentlyMobile);
                        if (!isCurrentlyMobile) {
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

        if (isTournamentRoute) {
                return null;
        }

        const shouldShow = isNavVisible && (!isHomeRoute || isPastHero);

        return (
                <>
                <div
                        className={cn(
                                "floating-navbar-frame",
                                !prefersReducedMotion &&
                                        "transition-transform transition-opacity duration-300 ease-out",
                                prefersReducedMotion && "transition-none",
                                shouldShow
                                        ? "translate-y-0 opacity-100"
                                        : "translate-y-[calc(100%+1.25rem)] opacity-0 pointer-events-none",
                        )}
                >
                        <LiquidGlass
                                id={`floating-navbar-${navGlassId.replace(/:/g, "-")}`}
                                {...getGlassPreset("navbar")}
                                className="floating-navbar-shell app-navbar-glass"
                                style={{ width: "100%", height: "auto" }}
                        >
                                <nav aria-label="Primary" className="floating-navbar">
                                        <div
                                                className="floating-navbar__primary"
                                                style={{
                                                        gridTemplateColumns: `repeat(${primaryItemCount}, minmax(0, 1fr))`,
                                                }}
                                        >
                                                <FloatingNavItem
                                                        icon={
                                                                isTournamentActive
                                                                        ? Trophy
                                                                        : selectedCount >= 2
                                                                                ? Trophy
                                                                                : CheckCircle
                                                        }
                                                        label={
                                                                isTournamentActive
                                                                        ? "Tournament"
                                                                        : selectedCount >= 2
                                                                                ? `Start (${selectedCount})`
                                                                                : "Pick Names"
                                                        }
                                                        isCurrent={
                                                                isHomeRoute &&
                                                                (activeSection === "pick" || activeSection === "tournament")
                                                        }
                                                        isAccent={isTournamentActive || selectedCount >= 2}
                                                        onClick={() => {
                                                                if (isTournamentActive) {
                                                                        handleNavClick("tournament");
                                                                } else if (selectedCount >= 2) {
                                                                        handleStartTournament();
                                                                } else {
                                                                        handleNavClick("pick");
                                                                }
                                                        }}
                                                />

                                                <FloatingNavItem
                                                        icon={BarChart3}
                                                        label="Analyze"
                                                        isCurrent={isHomeRoute && activeSection === "analysis"}
                                                        onClick={() => handleNavClick("analysis")}
                                                />

                                                <FloatingNavItem
                                                        icon={Lightbulb}
                                                        label="Suggest"
                                                        isCurrent={isHomeRoute && activeSection === "suggest"}
                                                        onClick={() => handleNavClick("suggest")}
                                                />

                                                {isAdmin && (
                                                        <FloatingNavItem
                                                                icon={Lock}
                                                                label="Admin"
                                                                isCurrent={isAdminRoute}
                                                                onClick={handleAdminClick}
                                                        />
                                                )}

                                                <div ref={profileButtonRef} className="contents">
                                                <FloatingNavItem
                                                        icon={User}
                                                        label={profileLabel}
                                                        isCurrent={isProfileOpen}
                                                        onClick={() => {
                                                                hapticNavTap();
                                                                const buttonEl = profileButtonRef.current?.querySelector("button");
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
                                                        }}
                                                        customIcon={
                                                                isLoggedIn && avatarUrl ? (
                                                                        <img
                                                                                src={avatarUrl}
                                                                                alt={profileLabel}
                                                                                className="floating-navbar__avatar"
                                                                        />
                                                                ) : (
                                                                        <User
                                                                                className={cn(
                                                                                        "h-5 w-5",
                                                                                        isLoggedIn && isAdmin && "text-chart-4",
                                                                                        isLoggedIn && !isAdmin && "text-primary",
                                                                                )}
                                                                        />
                                                                )
                                                        }
                                                />
                                                </div>
                                        </div>

                                        {/* Utility toggle hidden on mobile via CSS, moved into picker surface */}
                                        <div className="floating-navbar__utility">
                                                <FloatingNavItem
                                                        icon={isSwipeMode ? Layers : LayoutGrid}
                                                        label={isSwipeMode ? "Swipe" : "Grid"}
                                                        variant="utility"
                                                        isPressed={isSwipeMode}
                                                        ariaLabel={isSwipeMode ? "Swipe mode active" : "Grid mode active"}
                                                        onClick={() => setSwipeMode(!isSwipeMode)}
                                                />
                                        </div>
                                </nav>
                        </LiquidGlass>
                </div>
                {isProfileOpen && (
                        <Modal
                                title="Your Profile"
                                hideTitle
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
                </>
        );
}
