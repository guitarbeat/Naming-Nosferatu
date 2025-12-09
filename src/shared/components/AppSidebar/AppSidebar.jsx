/**
 * @module AppSidebar
 * @description Application navbar navigation component with sliding indicator
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";
import { MenuNavItem } from "./MenuNavItem";
import { MenuActionItem } from "./MenuActionItem";
import { ThemeToggleActionItem } from "./ThemeToggleActionItem";
import { NavbarSection } from "./NavbarSection";
import { UserDisplay } from "./components/UserDisplay";
import {
  LogoutIcon,
  PhotosIcon,
  SuggestIcon,
  AnalysisIcon,
  ResultsIcon,
} from "./icons";
import "./AppSidebar.css";

export function AppSidebar({
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
  const [indicator, setIndicator] = useState({ left: 0, opacity: 0 });

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
    const targetLeft = itemRect.left - navRect.left + itemRect.width / 2 - 6;
    setIndicator({ left: targetLeft, opacity: 1 });
  }, []);

  useEffect(() => {
    // * Ensure indicator placement on mount and resize with proper cleanup
    if (typeof window === "undefined") return undefined;
    const handleResize = () => requestAnimationFrame(updateIndicator);
    const rafId = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateIndicator]);

  useEffect(() => {
    // * Refresh indicator on view/mode change
    const rafId = requestAnimationFrame(updateIndicator);
    return () => cancelAnimationFrame(rafId);
  }, [view, isAnalysisMode, currentRoute, updateIndicator]);

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

  // * Define navigation items - data-driven approach
  // * Note: Tournament is handled separately as the home button
  const navItems = useMemo(
    () => [
      {
        key: "gallery",
        label: "Gallery",
        icon: PhotosIcon,
        onClick: () => {
          if (typeof onOpenPhotos === "function") {
            onOpenPhotos();
          }
        },
        isActive: view === "photos",
        ariaLabel: "Open cat photo gallery",
      },
      {
        key: "results",
        label: "Results",
        icon: ResultsIcon,
        onClick: () => {
          if (typeof onNavigate === "function") {
            onNavigate("/results");
          }
        },
        href: "/results",
        isActive:
          typeof currentRoute === "string" &&
          currentRoute.startsWith("/results"),
        ariaLabel: "See completed tournament results",
      },
      {
        key: "analysis",
        label: "Analysis Mode",
        icon: AnalysisIcon,
        onClick: handleAnalysisToggle,
        isActive: isAnalysisMode,
        ariaLabel: isAnalysisMode
          ? "Disable analysis mode"
          : "Enable analysis mode",
      },
    ],
    [
      currentRoute,
      handleAnalysisToggle,
      isAnalysisMode,
      onNavigate,
      onOpenPhotos,
      view,
    ]
  );

  return (
    <Sidebar className="app-sidebar" role="navigation" aria-label="Primary">
      <div className="navbar-shell">
        <div className="navbar-content">
          {/* Left Section: Navigation Items */}
          <NavbarSection className="navbar-left">
            <SidebarGroup open={true}>
              <SidebarGroupContent ref={navRef} className="nav-items-container">
                {/* Combined Logo + Tournament Home Button */}
                <SidebarMenuItem
                  data-active={view === "tournament" && !isAnalysisMode}
                >
                  <SidebarMenuButton asChild>
                    <button
                      type="button"
                      onClick={() => setView("tournament")}
                      className="sidebar-home-button"
                      data-active={view === "tournament" && !isAnalysisMode}
                      aria-label="Go to Tournament home"
                    >
                      <div className="sidebar-logo-icon">
                        <video
                          className="sidebar-logo-video"
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
                          <source
                            src="/assets/images/cat.webm"
                            type="video/webm"
                          />
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
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Main Navigation */}
                {navItems.map((item) => (
                  <MenuNavItem
                    key={item.key}
                    itemKey={item.key}
                    icon={item.icon}
                    label={item.label}
                    view={view}
                    onClick={item.onClick || setView}
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
                    width: "12px",
                    height: "12px",
                    opacity: indicator.opacity,
                  }}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </NavbarSection>

          <div className="navbar-divider" aria-hidden="true" />

          {/* Right Section: Actions */}
          <NavbarSection className="navbar-right" alignRight>
            <div className="navbar-action-tray">
              <SidebarGroup open={true} className="navbar-actions-shell">
                <SidebarGroupContent className="navbar-actions">
                  <MenuActionItem
                    icon={SuggestIcon}
                    label="Suggest Name"
                    onClick={onOpenSuggestName}
                    className="sidebar-suggest-button"
                    ariaLabel="Suggest a new cat name"
                    condition={true}
                  />
                  <ThemeToggleActionItem
                    onChange={onThemePreferenceChange}
                    themePreference={themePreference}
                    currentTheme={currentTheme}
                  />
                </SidebarGroupContent>
              </SidebarGroup>

              {isLoggedIn && userName && (
                <SidebarGroup open={true} className="navbar-user-shell">
                  <SidebarGroupContent className="navbar-user">
                    <UserDisplay userName={userName} isAdmin={isAdmin} />
                    <MenuActionItem
                      icon={LogoutIcon}
                      label="Logout"
                      onClick={onLogout}
                      className="sidebar-logout-button"
                      condition={isLoggedIn}
                    />
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </div>
          </NavbarSection>
        </div>
      </div>
    </Sidebar>
  );
}

AppSidebar.propTypes = {
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
