/**
 * @module AppNavbar
 * @description Application navbar navigation component with sliding indicator
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Navbar, NavbarMenuItem, NavbarMenuButton } from "../ui/navbar";
import LiquidGlass from "../LiquidGlass";
import { MenuNavItem } from "./MenuNavItem";
import { MenuActionItem } from "./MenuActionItem";
import { ThemeToggleActionItem } from "./ThemeToggleActionItem";
import { UserDisplay } from "./components/UserDisplay";
import { LogoutIcon, SuggestIcon } from "./icons";
import { buildNavItems } from "./navConfig";
import "./Navbar.css";

export function AppNavbar({
  view,
  setView,
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onStartNewTournament: _onStartNewTournament,
  themePreference,
  currentTheme,
  onThemePreferenceChange,
  onOpenSuggestName,
  onOpenPhotos,
  currentRoute,
  onNavigate,
}) {
  const navRef = useRef(null);
  const resizeRafRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, opacity: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const indicatorSize = 14;

  // * Check if analysis mode is active
  const isAnalysisMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("analysis") === "true"
      : false;

  // * Update sliding indicator position with minimal JS
  const updateIndicator = useCallback(() => {
    if (!navRef.current) return;
    const activeItem = navRef.current.querySelector('[data-active="true"]');
    if (!activeItem) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    // * Center the indicator under the active item using the configured size
    const targetLeft =
      itemRect.left - navRect.left + itemRect.width / 2 - indicatorSize / 2;
    setIndicator({ left: targetLeft, opacity: 1 });
  }, [indicatorSize]);

  useEffect(() => {
    // * Ensure indicator placement on mount and resize with proper cleanup
    if (typeof window === "undefined") return undefined;
    const handleResize = () => {
      if (resizeRafRef.current) return;
      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        updateIndicator();
      });
    };
    const initialRafId = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", handleResize);
    return () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      cancelAnimationFrame(initialRafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateIndicator]);

  useEffect(() => {
    // * Refresh indicator on view/mode change
    const rafId = requestAnimationFrame(updateIndicator);
    return () => cancelAnimationFrame(rafId);
  }, [view, isAnalysisMode, currentRoute, updateIndicator]);

  useEffect(() => {
    // * Close the mobile menu whenever navigation changes
    setIsMenuOpen(false);
  }, [view, currentRoute, isAnalysisMode]);

  useEffect(() => {
    // * Close menu on Escape for accessibility
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // * Toggle analysis mode
  const handleAnalysisToggle = useCallback(() => {
    const currentPath = window.location.pathname;
    const currentSearch = new URLSearchParams(window.location.search);

    if (isAnalysisMode) {
      currentSearch.delete("analysis");
    } else {
      currentSearch.set("analysis", "true");
    }

    const newSearch = currentSearch.toString();
    const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;
    window.history.pushState({}, "", newUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [isAnalysisMode]);

  // * Build navigation items from single source of truth
  const navItems = useMemo(
    () =>
      buildNavItems({
        view,
        currentRoute,
        isAnalysisMode,
        onOpenPhotos,
        onNavigate,
        onToggleAnalysis: handleAnalysisToggle,
      }),
    [
      currentRoute,
      handleAnalysisToggle,
      isAnalysisMode,
      onNavigate,
      onOpenPhotos,
      view,
    ]
  );

  const handleNavItemClick = useCallback(
    (item) => {
      setIsMenuOpen(false);
      if (typeof item.onClick === "function") {
        item.onClick();
      } else {
        setView(item.key);
      }
    },
    [setView]
  );

  return (
    <LiquidGlass
      width={1200}
      height={90}
      radius={18}
      turbulence={0.18}
      saturation={1.1}
      displace={0.25}
      className="app-navbar-glass"
      id="navbar-liquid-glass"
      style={{ width: "100%", height: "auto", minHeight: "72px" }}
    >
      <Navbar
        className="app-navbar navbar-shell"
        role="navigation"
        aria-label="Primary"
      >
        <div className="navbar-content" data-menu-open={isMenuOpen}>
          {/* Left Section: Navigation Items */}
          <div className="navbar-mobile-toggle">
            <input
              id="navbar-menu-toggle"
              className="menu-checkbox"
              type="checkbox"
              checked={isMenuOpen}
              onChange={() => setIsMenuOpen((prev) => !prev)}
              aria-hidden="true"
            />
            <button
              type="button"
              className="menu-button"
              aria-expanded={isMenuOpen}
              aria-controls="navbar-menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span className="menu-button-label" data-show-when="closed">
                Menu
              </span>
              <span className="menu-button-label" data-show-when="open">
                Close
              </span>
            </button>
          </div>

          <div
            className="nav-items-container navbar-section navbar-section--left"
            id="navbar-menu"
            data-open={isMenuOpen}
            ref={navRef}
          >
            {/* Combined Logo + Tournament Home Button */}
            <NavbarMenuItem
              data-active={view === "tournament" && !isAnalysisMode}
            >
              <NavbarMenuButton asChild>
                <button
                  type="button"
                  onClick={() => setView("tournament")}
                  className="navbar-home-button"
                  data-active={view === "tournament" && !isAnalysisMode}
                  aria-label="Go to Tournament home"
                >
                  <div className="navbar-logo-icon">
                    <video
                      className="navbar-logo-video"
                      width="24"
                      height="24"
                      muted
                      loop
                      autoPlay
                      playsInline
                      preload="none"
                      aria-label="Cat animation"
                      onError={(e) => {
                        // * Fallback to image if video fails to load
                        e.target.style.display = "none";
                        const img = e.target.nextElementSibling;
                        if (img) img.style.display = "block";
                      }}
                    >
                      <source src="/assets/images/cat.webm" type="video/webm" />
                      <img
                        src="/assets/images/cat.gif"
                        alt="Cat animation"
                        width="24"
                        height="24"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        style={{ display: "none" }}
                      />
                    </video>
                  </div>
                  <span>Tournament</span>
                </button>
              </NavbarMenuButton>
            </NavbarMenuItem>

            {/* Main Navigation */}
            {navItems.map((item) => (
              <MenuNavItem
                key={item.key}
                itemKey={item.key}
                icon={item.icon}
                label={item.label}
                view={view}
                onClick={() => handleNavItemClick(item)}
                isActive={item.isActive}
                href={item.href}
                ariaLabel={item.ariaLabel}
                data-active={item.isActive}
              />
            ))}

            {/* Sliding indicator with bounce */}
            <div
              className="navbar-indicator"
              style={{
                transform: `translateX(${indicator.left}px)`,
                width: `${indicatorSize}px`,
                height: `${indicatorSize}px`,
                opacity: indicator.opacity,
              }}
            />
          </div>

          {/* Inline Actions inside nav container for alignment */}
          <div className="navbar-action-tray nav-inline-actions">
            <div className="navbar-actions-shell">
              <div className="navbar-actions">
                <MenuActionItem
                  icon={SuggestIcon}
                  label="Suggest Name"
                  onClick={onOpenSuggestName}
                  className="navbar-suggest-button"
                  ariaLabel="Suggest a new cat name"
                  condition={true}
                />
                <ThemeToggleActionItem
                  onChange={onThemePreferenceChange}
                  themePreference={themePreference}
                  currentTheme={currentTheme}
                />
              </div>
            </div>

            {isLoggedIn && userName && (
              <div className="navbar-user-shell">
                <div className="navbar-user">
                  <UserDisplay userName={userName} isAdmin={isAdmin} />
                  <MenuActionItem
                    icon={LogoutIcon}
                    label="Logout"
                    onClick={onLogout}
                    className="navbar-logout-button"
                    condition={isLoggedIn}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Mobile overlay to lock scroll and close menu on click */}
        <div
          className="navbar-overlay"
          data-open={isMenuOpen}
          onClick={() => setIsMenuOpen(false)}
        />
      </Navbar>
    </LiquidGlass>
  );
}

AppNavbar.propTypes = {
  view: PropTypes.string.isRequired,
  setView: PropTypes.func.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  userName: PropTypes.string,
  isAdmin: PropTypes.bool,
  onLogout: PropTypes.func.isRequired,
  onStartNewTournament: PropTypes.func,
  themePreference: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
  onThemePreferenceChange: PropTypes.func.isRequired,
  onOpenSuggestName: PropTypes.func,
  onOpenPhotos: PropTypes.func,
  currentRoute: PropTypes.string,
  onNavigate: PropTypes.func,
};
