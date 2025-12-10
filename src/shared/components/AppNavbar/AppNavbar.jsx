/**
 * @module AppNavbar (Shadcn/ui-refactored)
 * @description Simplified navbar component using shadcn/ui primitives and Radix UI
 * Much simpler than original with less custom code and better maintainability
 */

import { useMemo, useCallback, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Navbar,
  NavbarContent,
  NavbarSection,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuButton,
  NavbarSeparator,
  NavbarIconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/navbar-shadcn";
import LiquidGlass from "../LiquidGlass";
import { UserDisplay } from "./components/UserDisplay";
import { LogoutIcon, SuggestIcon } from "./icons";
import { buildNavItems } from "./navConfig";
import { useNavbarIndicator, useNavbarMenu } from "./hooks";
import "./Navbar.css";

/**
 * Main Navbar Component
 * Wraps everything in LiquidGlass effect and provides navigation structure
 */
export function AppNavbar({
  view,
  setView,
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  themePreference,
  currentTheme,
  onThemePreferenceChange,
  onOpenSuggestName,
  onOpenPhotos,
  currentRoute,
  onNavigate,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // * Check if analysis mode is active
  const isAnalysisMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("analysis") === "true"
      : false;

  // * Hook for sliding indicator animation
  const { indicator, indicatorSize } = useNavbarIndicator({
    indicatorSize: 14,
    view,
    isAnalysisMode,
    currentRoute,
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

  // * Build navigation items
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
    [currentRoute, handleAnalysisToggle, isAnalysisMode, onNavigate, onOpenPhotos, view]
  );

  const handleNavItemClick = useCallback(
    (item) => {
      setIsMobileMenuOpen(false);
      if (typeof item.onClick === "function") {
        item.onClick();
      } else {
        setView(item.key);
      }
    },
    [setView]
  );

  const handleHomeClick = useCallback(() => {
    setIsMobileMenuOpen(false);
    setView("tournament");
  }, [setView]);

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
      className="app-navbar-glass"
      style={{ width: "100%", height: "auto", minHeight: "72px" }}
    >
      <Navbar className="app-navbar navbar-shell" role="navigation" aria-label="Primary">
        <NavbarContent>
          {/* Desktop Navigation */}
          <NavbarSection className="nav-items-container nav-items-container--desktop">
            {/* Home/Tournament Button */}
            <NavbarMenuItem data-active={view === "tournament" && !isAnalysisMode}>
              <NavbarMenuButton asChild>
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="navbar-home-button"
                  data-active={view === "tournament" && !isAnalysisMode}
                  aria-label="Go to Tournament home"
                  aria-current={view === "tournament" && !isAnalysisMode ? "page" : undefined}
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

            {/* Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavbarMenuItem key={item.key} data-active={item.isActive}>
                  <NavbarMenuButton asChild>
                    <button
                      type="button"
                      onClick={() => handleNavItemClick(item)}
                      className={item.isActive ? "active" : ""}
                      aria-current={item.isActive ? "page" : undefined}
                      aria-label={item.ariaLabel || item.label}
                      title={item.label}
                      data-active={item.isActive}
                    >
                      <Icon />
                      <span className="nav-item-label">{item.label}</span>
                    </button>
                  </NavbarMenuButton>
                </NavbarMenuItem>
              );
            })}

            {/* Sliding Indicator */}
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

          {/* Divider */}
          <NavbarSeparator />

          {/* Action Items */}
          <NavbarSection>
            <NavbarMenuItem>
              <NavbarIconButton
                onClick={onOpenSuggestName}
                aria-label="Suggest a new cat name"
                title="Suggest a name"
              >
                <SuggestIcon />
              </NavbarIconButton>
            </NavbarMenuItem>

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <NavbarIconButton
                  aria-label={`Theme: ${themePreference}. Currently ${currentTheme}`}
                  title="Toggle theme"
                >
                  {currentTheme === "dark" ? "🌙" : "☀️"}
                </NavbarIconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["light", "dark", "system"].map((theme) => (
                  <DropdownMenuItem
                    key={theme}
                    onClick={() => onThemePreferenceChange(theme)}
                    data-active={themePreference === theme}
                  >
                    <span>{theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "⚙️"}</span>
                    <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {isLoggedIn && userName && (
              <>
                <NavbarSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <NavbarIconButton aria-label={`User menu for ${userName}`}>
                      <UserDisplay userName={userName} isAdmin={isAdmin} />
                    </NavbarIconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <span className="text-sm">{userName}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogoutIcon />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </NavbarSection>

          {/* Mobile Menu Toggle */}
          <NavbarSection className="navbar-mobile-toggle">
            <NavbarIconButton
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
              aria-controls="navbar-mobile-menu"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </NavbarIconButton>
          </NavbarSection>
        </NavbarContent>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="navbar-mobile-menu"
            className="navbar-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <NavbarMenu>
              <NavbarMenuItem>
                <NavbarMenuButton asChild>
                  <button
                    type="button"
                    onClick={handleHomeClick}
                    data-active={view === "tournament" && !isAnalysisMode}
                    className="navbar-mobile-link"
                    aria-current={view === "tournament" && !isAnalysisMode ? "page" : undefined}
                  >
                    <span>Tournament</span>
                  </button>
                </NavbarMenuButton>
              </NavbarMenuItem>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavbarMenuItem key={`mobile-${item.key}`}>
                    <NavbarMenuButton asChild>
                      <button
                        type="button"
                        onClick={() => handleNavItemClick(item)}
                        data-active={item.isActive}
                        className="navbar-mobile-link"
                        aria-current={item.isActive ? "page" : undefined}
                        aria-label={item.ariaLabel || item.label}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </button>
                    </NavbarMenuButton>
                  </NavbarMenuItem>
                );
              })}
            </NavbarMenu>
          </div>
        )}
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
  themePreference: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
  onThemePreferenceChange: PropTypes.func.isRequired,
  onOpenSuggestName: PropTypes.func,
  onOpenPhotos: PropTypes.func,
  currentRoute: PropTypes.string,
  onNavigate: PropTypes.func,
};

export default AppNavbar;
