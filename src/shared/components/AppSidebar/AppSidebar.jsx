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
  const indicatorRef = useRef({
    left: 0,
    width: 12,
    opacity: 0,
    translateY: 0,
  });
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 12,
    opacity: 0,
    translateY: 0,
  });

  const applyIndicator = useCallback((next) => {
    indicatorRef.current = next;
    setIndicator(next);
  }, []);

  // * Check if analysis mode is active
  const isAnalysisMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("analysis") === "true"
      : false;

  // * Update sliding indicator position with bounce animation
  const updateIndicator = useCallback(
    (animate = false) => {
      if (!navRef.current) return;
      const activeItem = navRef.current.querySelector('[data-active="true"]');
      if (!activeItem) {
        applyIndicator({
          ...indicatorRef.current,
          opacity: 0,
          translateY: 0,
        });
        return;
      }

      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const targetLeft = itemRect.left - navRect.left + itemRect.width / 2 - 6;

      if (!animate) {
        applyIndicator({
          left: targetLeft,
          width: 12,
          opacity: 1,
          translateY: 0,
        });
        return;
      }

      const startLeft = indicatorRef.current.left;
      const startTime = performance.now();
      const duration = 400;

      const animateStep = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentX = startLeft + (targetLeft - startLeft) * eased;
        const bounceY = -32 * (4 * eased * (1 - eased));

        applyIndicator({
          left: currentX,
          width: 12,
          opacity: 1,
          translateY: bounceY,
        });

        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          applyIndicator({
            left: targetLeft,
            width: 12,
            opacity: 1,
            translateY: 0,
          });
        }
      };

      requestAnimationFrame(animateStep);
    },
    [applyIndicator]
  );

  useEffect(() => {
    // * Ensure indicator placement on mount and resize with proper cleanup
    const handleResize = () => updateIndicator(false);
    updateIndicator(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateIndicator]);

  useEffect(() => {
    // Animate on view/mode change
    updateIndicator(true);
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
    <Sidebar className="app-sidebar">
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
                  transform: `translateX(${indicator.left}px) translateY(${indicator.translateY}px)`,
                  width: `${indicator.width}px`,
                  height: `${indicator.width}px`,
                  opacity: indicator.opacity,
                }}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </NavbarSection>

        {/* Right Section: Actions */}
        <NavbarSection className="navbar-right" alignRight>
          {/* Actions Section */}
          <SidebarGroup open={true}>
            <SidebarGroupContent>
              {/* Suggest a Name */}
              <MenuActionItem
                icon={SuggestIcon}
                label="Suggest Name"
                onClick={onOpenSuggestName}
                className="sidebar-suggest-button"
                ariaLabel="Suggest a new cat name"
                condition={true}
              />

              {/* Theme Toggle */}
              <ThemeToggleActionItem
                onChange={onThemePreferenceChange}
                themePreference={themePreference}
                currentTheme={currentTheme}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {/* User Display and Logout - Stacked vertically */}
          {isLoggedIn && userName && (
            <SidebarGroup open={true}>
              <SidebarGroupContent>
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
        </NavbarSection>
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
