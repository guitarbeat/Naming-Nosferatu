/**
 * @module AppNavbar
 * @description Consolidated navigation bar component
 * All functionality in one file for simplicity
 */

import { useCallback, useEffect, useState, useRef, useMemo, useId, createContext } from "react";
import { Button } from "@heroui/react";
import LiquidGlass from "../LiquidGlass";
import { useCollapsible } from "../../hooks/useCollapsible";
import { STORAGE_KEYS } from "../../../core/constants";
import "./AppNavbar.css";

// ============================================================================
// TYPES
// ============================================================================

type ViewType = "tournament" | "photos" | string;

interface NavItem {
  key: string;
  label: string;
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  ariaLabel?: string;
  isActive: boolean;
  onClick?: () => void;
}

interface AppNavbarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  onStartNewTournament?: () => void;
  onOpenSuggestName?: () => void;
  onOpenPhotos?: () => void;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
}

interface NavbarContextValue {
  view: ViewType;
  setView: (view: ViewType) => void;
  isAnalysisMode: boolean;
  toggleAnalysis: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  onOpenPhotos?: () => void;
  onOpenSuggestName?: () => void;
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

// ============================================================================
// ICONS
// ============================================================================

interface IconProps {
  className?: string;
  "aria-hidden"?: boolean;
}

function Icon({ children, ...props }: React.PropsWithChildren<IconProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

function PhotosIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8a3 3 0 0 1 3-3h2l1.2-1.6a1 1 0 0 1 .8-.4h4a1 1 0 0 1 .8.4L18 5h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
      <circle cx="12" cy="11" r="2.6" />
      <path d="m4 16 4.5-4 2.5 2.5L14 11l6 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7.5h.01" strokeWidth="2.4" strokeLinecap="round" />
    </Icon>
  );
}

function AnalysisIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V6" />
      <path d="M20 20H4" />
      <path d="m6 14 3.5-4 3 3 5.5-6" />
      <circle cx="9.5" cy="10" r="1.6" fill="currentColor" opacity="0.35" />
      <circle cx="17.5" cy="7" r="1.6" fill="currentColor" opacity="0.35" />
      <path d="M18 4v3h3" />
    </Icon>
  );
}

function SuggestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1Z" />
      <path d="M21 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
      <path d="M3 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
      <path d="M18.36 4.64a1 1 0 0 0-1.41 1.41 1 1 0 0 0 1.41-1.41Z" />
      <path d="M7.05 4.64a1 1 0 0 0-1.41-1.41 1 1 0 0 0 1.41 1.41Z" />
      <path d="M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3.5-5 3.5s-5-1-5-3.5a5 5 0 0 1 5-5Z" />
      <path d="M9 18a3 3 0 0 0 6 0" />
    </Icon>
  );
}

function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </Icon>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

const ANALYSIS_QUERY_PARAM = "analysis";

function useAnalysisMode() {
  const [isAnalysisMode, setIsAnalysisMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get(ANALYSIS_QUERY_PARAM) === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function checkAnalysisModeFromUrl() {
      const isActive = new URLSearchParams(window.location.search).get(ANALYSIS_QUERY_PARAM) === "true";
      setIsAnalysisMode(isActive);
    }

    checkAnalysisModeFromUrl();
    window.addEventListener("popstate", checkAnalysisModeFromUrl);
    window.addEventListener("locationchange", checkAnalysisModeFromUrl);

    return () => {
      window.removeEventListener("popstate", checkAnalysisModeFromUrl);
      window.removeEventListener("locationchange", checkAnalysisModeFromUrl);
    };
  }, []);

  return isAnalysisMode;
}

function useToggleAnalysis() {
  return useCallback(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const isActive = searchParams.get(ANALYSIS_QUERY_PARAM) === "true";

    if (isActive) {
      searchParams.delete(ANALYSIS_QUERY_PARAM);
    } else {
      searchParams.set(ANALYSIS_QUERY_PARAM, "true");
    }

    const updatedSearchString = searchParams.toString();
    const newUrl = updatedSearchString ? `${currentPath}?${updatedSearchString}` : currentPath;
    window.history.pushState({}, "", newUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
}

function useNavbarCollapse(defaultCollapsed = false) {
  const { isCollapsed, toggleCollapsed } = useCollapsible(STORAGE_KEYS.NAVBAR_COLLAPSED, defaultCollapsed);
  return { isCollapsed, toggle: toggleCollapsed };
}

function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) close();
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const menu = document.getElementById("app-navbar-mobile-panel");
      const toggle = target.closest(".app-navbar__toggle");

      if (menu && !menu.contains(target) && !toggle) close();
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, close]);

  return { isOpen, toggle, close };
}

interface NavbarDimensions {
  width: number;
  height: number;
}

function useNavbarDimensions(isCollapsed: boolean) {
  const navbarRef = useRef<HTMLElement>(null);
  const [dimensions, setDimensions] = useState<NavbarDimensions>({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: 80,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function updateDimensions() {
      if (navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        setDimensions({
          width: isCollapsed ? Math.max(rect.width, 64) : window.innerWidth,
          height: isCollapsed ? Math.max(rect.height, 56) : Math.max(rect.height, 56),
        });
      } else {
        setDimensions({
          width: isCollapsed ? 64 : window.innerWidth,
          height: isCollapsed ? 56 : 80,
        });
      }
    }

    const frameId = requestAnimationFrame(updateDimensions);
    window.addEventListener("resize", updateDimensions);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [isCollapsed]);

  return { navbarRef, dimensions };
}

// ============================================================================
// CONTEXT
// ============================================================================

const NavbarContext = createContext<NavbarContextValue | null>(null);

function NavbarProvider({ value, children }: { value: NavbarContextValue; children: React.ReactNode }) {
  return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>;
}

// ============================================================================
// UTILS
// ============================================================================

interface BuildNavItemsContext {
  view: ViewType;
  isAnalysisMode: boolean;
  onOpenPhotos?: () => void;
  onToggleAnalysis: () => void;
}

function buildNavItems(context: BuildNavItemsContext): NavItem[] {
  const { view, isAnalysisMode, onOpenPhotos, onToggleAnalysis } = context;

  return [
    {
      key: "gallery",
      label: "Gallery",
      shortLabel: "Photos",
      icon: PhotosIcon,
      ariaLabel: "Open cat photo gallery",
      isActive: view === "photos",
      onClick: () => onOpenPhotos?.(),
    },
    {
      key: "analysis",
      label: "Analysis Mode",
      shortLabel: "Analysis",
      icon: AnalysisIcon,
      ariaLabel: isAnalysisMode ? "Disable analysis mode" : "Enable analysis mode",
      isActive: Boolean(isAnalysisMode),
      onClick: () => onToggleAnalysis(),
    },
  ];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function NavbarBrand({ isActive, onClick, ariaLabel }: { isActive: boolean; onClick: () => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-navbar__brand"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
    >
      Tournament
      <small>Daily bracket</small>
    </button>
  );
}

function NavbarLink({
  item,
  onClick,
  className = "app-navbar__link",
  showIcon = true,
}: {
  item: NavItem;
  onClick: (item: NavItem) => void;
  className?: string;
  showIcon?: boolean;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={className}
      data-active={item.isActive}
      aria-current={item.isActive ? "page" : undefined}
      aria-label={item.ariaLabel || item.label}
      title={item.label}
    >
      {showIcon && Icon && <Icon className="app-navbar__link-icon" aria-hidden />}
      <span className="app-navbar__link-text">{item.shortLabel || item.label}</span>
    </button>
  );
}

function MobileMenuToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="app-navbar__toggle"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="app-navbar-mobile-panel"
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

const MAX_NAME_LENGTH = 18;

function UserDisplay({ userName, isAdmin = false }: { userName: string; isAdmin?: boolean }) {
  if (!userName) return null;

  const truncatedUserName =
    userName.length > MAX_NAME_LENGTH ? `${userName.substring(0, MAX_NAME_LENGTH)}...` : userName;

  return (
    <div className="navbar-user-display">
      <div className="navbar-user-display__content">
        <div className="navbar-user-display__text">
          <span className="navbar-user-display__name">{truncatedUserName}</span>
          {isAdmin && (
            <span className="navbar-user-display__admin-label" aria-label="Admin">
              Admin
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NavbarCollapseToggle({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="app-navbar__collapse-toggle"
      aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      aria-expanded={!isCollapsed}
      title={isCollapsed ? "Expand" : "Collapse"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="app-navbar__collapse-icon"
        aria-hidden
      >
        {isCollapsed ? (
          <>
            <path d="M9 18l6-6-6-6" />
          </>
        ) : (
          <>
            <path d="M15 18l-6-6 6-6" />
          </>
        )}
      </svg>
    </button>
  );
}

function NavbarActions({
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onOpenSuggestName,
}: {
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  onOpenSuggestName?: () => void;
}) {
  return (
    <div className="app-navbar__actions">
      {isLoggedIn && userName && <UserDisplay userName={userName} isAdmin={isAdmin} />}
      {onOpenSuggestName && (
        <Button
          onClick={onOpenSuggestName}
          className="app-navbar__action-btn"
          aria-label="Suggest a name"
          title="Suggest a new cat name"
        >
          <SuggestIcon aria-hidden />
          <span className="app-navbar__action-text">Suggest</span>
        </Button>
      )}
      {isLoggedIn && (
        <Button
          onClick={onLogout}
          className="app-navbar__action-btn app-navbar__action-btn--logout"
          aria-label="Log out"
          title="Log out of your account"
        >
          <LogoutIcon aria-hidden />
          <span className="app-navbar__action-text">Logout</span>
        </Button>
      )}
    </div>
  );
}

function MobileMenu({
  isOpen,
  navItems,
  homeIsActive,
  onHomeClick,
  onNavClick,
}: {
  isOpen: boolean;
  navItems: NavItem[];
  homeIsActive: boolean;
  onHomeClick: () => void;
  onNavClick: (item: NavItem) => void;
}) {
  const firstLinkRef = useRef<HTMLButtonElement>(null);
  const lastLinkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      firstLinkRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, isFirst: boolean, isLast: boolean) => {
      if (event.key === "Tab") {
        if (event.shiftKey && isFirst) {
          event.preventDefault();
          lastLinkRef.current?.focus();
        } else if (!event.shiftKey && isLast) {
          event.preventDefault();
          firstLinkRef.current?.focus();
        }
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    <nav
      id="app-navbar-mobile-panel"
      className="app-navbar-mobile-panel"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="app-navbar-mobile-panel__content">
        <button
          ref={firstLinkRef}
          type="button"
          onClick={onHomeClick}
          className="app-navbar__link app-navbar__link--mobile"
          data-active={homeIsActive}
          aria-current={homeIsActive ? "page" : undefined}
          onKeyDown={(e) => handleKeyDown(e, true, navItems.length === 0)}
        >
          <span className="app-navbar__link-text">Tournament</span>
        </button>

        {navItems.map((item, index) => {
          const _isLast = index === navItems.length - 1;
          return (
            <NavbarLink
              key={item.key}
              item={item}
              onClick={onNavClick}
              className="app-navbar__link app-navbar__link--mobile"
            />
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AppNavbar({
  view,
  setView,
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onOpenSuggestName,
  onOpenPhotos,
}: AppNavbarProps) {
  const navbarGlassId = useId();
  const { isCollapsed, toggle: toggleCollapse } = useNavbarCollapse(false);
  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();
  const isAnalysisMode = useAnalysisMode();
  const toggleAnalysis = useToggleAnalysis();
  const { navbarRef, dimensions } = useNavbarDimensions(isCollapsed);

  const navItems = useMemo(
    () =>
      buildNavItems({
        view,
        isAnalysisMode,
        onOpenPhotos,
        onToggleAnalysis: toggleAnalysis,
      }),
    [view, isAnalysisMode, onOpenPhotos, toggleAnalysis]
  );

  const createHandler = useCallback(
    <T extends unknown[]>(fn?: (...args: T) => void) => {
      return (...args: T) => {
        closeMobileMenu();
        void Promise.resolve(fn?.(...args));
      };
    },
    [closeMobileMenu]
  );

  const handleNavClick = useCallback(
    (item: NavItem) => {
      closeMobileMenu();
      if (typeof item.onClick === "function") {
        void Promise.resolve(item.onClick());
        return;
      }
      setView(item.key);
    },
    [closeMobileMenu, setView]
  );

  const handleHomeClick = useCallback(() => {
    closeMobileMenu();
    setView("tournament");
  }, [closeMobileMenu, setView]);

  const handleLogout = createHandler(onLogout);

  const isHomeViewActive = view === "tournament" && !isAnalysisMode;

  const contextValue = useMemo(
    () => ({
      view,
      setView,
      isAnalysisMode,
      toggleAnalysis,
      isCollapsed,
      toggleCollapse,
      isMobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      onOpenPhotos,
      onOpenSuggestName,
      isLoggedIn,
      userName,
      isAdmin,
      onLogout: handleLogout,
    }),
    [
      view,
      setView,
      isAnalysisMode,
      toggleAnalysis,
      isCollapsed,
      toggleCollapse,
      isMobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      onOpenPhotos,
      onOpenSuggestName,
      isLoggedIn,
      userName,
      isAdmin,
      handleLogout,
    ]
  );

  return (
    <NavbarProvider value={contextValue}>
      <LiquidGlass
        id={`navbar-glass-${navbarGlassId.replace(/:/g, "-")}`}
        className={`app-navbar-glass app-navbar--horizontal ${isCollapsed ? "app-navbar-glass--collapsed" : ""}`}
        width={isCollapsed ? 64 : dimensions.width}
        height={isCollapsed ? 56 : dimensions.height}
        style={
          isCollapsed
            ? { width: "auto", maxWidth: "max-content", height: "auto", overflow: "visible" }
            : { width: "100%", height: "auto", overflow: "visible" }
        }
        data-orientation="horizontal"
        data-collapsed={isCollapsed}
      >
        <header
          ref={navbarRef}
          id="app-navbar"
          className={`app-navbar app-navbar--horizontal ${isCollapsed ? "app-navbar--collapsed" : ""}`}
          role="banner"
          data-orientation="horizontal"
          data-collapsed={isCollapsed}
        >
          <NavbarCollapseToggle isCollapsed={isCollapsed} onToggle={toggleCollapse} />

          <NavbarBrand isActive={isHomeViewActive} onClick={handleHomeClick} ariaLabel="Go to Tournament home" />

          {navItems.map((item) => (
            <NavbarLink key={item.key} item={item} onClick={handleNavClick} />
          ))}

          <NavbarActions
            isLoggedIn={isLoggedIn}
            userName={userName}
            isAdmin={isAdmin}
            onLogout={handleLogout}
            onOpenSuggestName={onOpenSuggestName}
          />

          <MobileMenuToggle isOpen={isMobileMenuOpen} onToggle={toggleMobileMenu} />
        </header>
      </LiquidGlass>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        navItems={navItems}
        homeIsActive={isHomeViewActive}
        onHomeClick={handleHomeClick}
        onNavClick={handleNavClick}
      />
    </NavbarProvider>
  );
}
