/**
 * @module AppNavbar
 * @description Application navbar navigation component with sliding indicator
 */

import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Navbar,
  NavbarMenuItem,
  NavbarMenuButton,
  NavbarSection,
} from "../ui/navbar";
import LiquidGlass from "../LiquidGlass";
import { MenuNavItem } from "./MenuNavItem";
import { MenuActionItem } from "./MenuActionItem";
import { ThemeToggleActionItem } from "./ThemeToggleActionItem";
import { UserDisplay } from "./components/UserDisplay";
import { LogoutIcon, SuggestIcon } from "./icons";
import { buildNavItems } from "./navConfig";
import { useNavbarIndicator, useNavbarMenu } from "./hooks";
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
  // * Check if analysis mode is active
  const isAnalysisMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("analysis") === "true"
      : false;

  // * Use custom hooks for indicator and menu management
  const { navRef, indicator, indicatorSize } = useNavbarIndicator({
    indicatorSize: 14,
    view,
    isAnalysisMode,
    currentRoute,
  });

  const { isMenuOpen, toggleMenu, closeMenu, menuButtonRef, menuRef } =
    useNavbarMenu({
      view,
      currentRoute,
      isAnalysisMode,
    });

  // * Toggle analysis mode
  const handleAnalysisToggle = useCallback(() => {
    if (typeof window === "undefined") return;

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
      closeMenu();
      if (typeof item.onClick === "function") {
        item.onClick();
      } else {
        setView(item.key);
      }
    },
    [closeMenu, setView]
  );

  const handleHomeClick = useCallback(() => {
    closeMenu();
    setView("tournament");
  }, [closeMenu, setView]);

  return (
    <LiquidGlass
      width={1200}
      height={90}
      radius={18}
      scale={-180}
      saturation={1.1}
      frost={0.05}
      inputBlur={8}
      outputBlur={0.9}
      chromaticR={10}
      chromaticG={11}
      chromaticB={12}
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
              onChange={toggleMenu}
              aria-hidden="true"
            />
            <button
              ref={menuButtonRef}
              type="button"
              className="menu-button"
              aria-expanded={isMenuOpen}
              aria-controls="navbar-menu"
              aria-label={
                isMenuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              onClick={toggleMenu}
            >
              <span className="menu-button-label" data-show-when="closed">
                Menu
              </span>
              <span className="menu-button-label" data-show-when="open">
                Close
              </span>
            </button>
          </div>

          <NavbarSection
            ref={(el) => {
              navRef.current = el;
              menuRef.current = el;
            }}
            className="nav-items-container"
            id="navbar-menu"
            data-open={isMenuOpen}
            role="menu"
            aria-label="Navigation menu"
          >
            {/* Combined Logo + Tournament Home Button */}
            <NavbarMenuItem
              data-active={view === "tournament" && !isAnalysisMode}
            >
              <NavbarMenuButton asChild>
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="navbar-home-button"
                  data-active={view === "tournament" && !isAnalysisMode}
                  aria-label="Go to Tournament home"
                  aria-current={
                    view === "tournament" && !isAnalysisMode
                      ? "page"
                      : undefined
                  }
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
          </NavbarSection>

          {/* Divider between nav items and actions */}
          <div className="navbar-divider" aria-hidden="true" />

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
          onClick={closeMenu}
          onKeyDown={(e) => {
            // * Allow Escape and Enter to close overlay
            if (e.key === "Escape" || e.key === "Enter") {
              closeMenu();
            }
          }}
          role="button"
          tabIndex={isMenuOpen ? 0 : -1}
          aria-label="Close navigation menu"
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
