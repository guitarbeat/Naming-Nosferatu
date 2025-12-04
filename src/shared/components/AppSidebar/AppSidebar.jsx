/**
 * @module AppSidebar
 * @description Application navbar navigation component with sliding indicator
 */

import { useRef, useEffect, useState, useCallback } from "react";
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
import { LogoutIcon, PhotosIcon, SuggestIcon, AnalysisIcon } from "./icons";
import "./AppSidebar.css";

export function AppSidebar({
  view,
  setView,
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onStartNewTournament: _onStartNewTournament,
  isLightTheme,
  onThemeChange,
  onOpenSuggestName,
  onOpenPhotos,
}) {
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 12, opacity: 0, translateY: 0 });

  // * Check if analysis mode is active
  const isAnalysisMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("analysis") === "true"
      : false;

  // * Update sliding indicator position with bounce animation
  const updateIndicator = useCallback((animate = false) => {
    if (!navRef.current) return;
    const activeItem = navRef.current.querySelector('[data-active="true"]');
    if (activeItem) {
      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const centerX = itemRect.left - navRect.left + itemRect.width / 2 - 6;

      if (animate) {
        // Bounce animation
        const start = indicator.left;
        const end = centerX;
        const startTime = Date.now();
        const duration = 500;

        const animateStep = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          const currentX = start + (end - start) * eased;
          const bounceY = -40 * (4 * eased * (1 - eased)); // Parabolic bounce

          setIndicator({
            left: currentX,
            width: 12,
            opacity: 1,
            translateY: bounceY,
          });

          if (progress < 1) {
            requestAnimationFrame(animateStep);
          } else {
            setIndicator({ left: end, width: 12, opacity: 1, translateY: 0 });
          }
        };

        requestAnimationFrame(animateStep);
      } else {
        setIndicator({
          left: centerX,
          width: 12,
          opacity: 1,
          translateY: 0,
        });
      }
    }
  }, [indicator.left]);

  useEffect(() => {
    // Initial position without animation
    setTimeout(() => updateIndicator(false), 100);
    window.addEventListener("resize", () => updateIndicator(false));
    return () => window.removeEventListener("resize", () => updateIndicator(false));
  }, [updateIndicator]);

  useEffect(() => {
    // Animate on view/mode change
    updateIndicator(true);
  }, [view, isAnalysisMode, updateIndicator]);

  // * Toggle analysis mode
  const handleAnalysisToggle = () => {
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
  };

  // * Define navigation items - data-driven approach
  // * Note: Tournament is handled separately as the home button
  const navItems = [
    {
      key: "analysis",
      label: "Analysis",
      icon: AnalysisIcon,
      onClick: handleAnalysisToggle,
      isActive: isAnalysisMode,
    },
  ];

  return (
    <Sidebar className="app-sidebar">
      <div className="navbar-content">
        {/* Left Section: Navigation Items */}
        <NavbarSection className="navbar-left">
          <SidebarGroup open={true}>
            <SidebarGroupContent ref={navRef} className="nav-items-container">
              {/* Combined Logo + Tournament Home Button */}
              <SidebarMenuItem data-active={view === "tournament" && !isAnalysisMode}>
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

              {/* Cat Gallery */}
              <MenuActionItem
                icon={PhotosIcon}
                label="Gallery"
                onClick={onOpenPhotos}
                className="sidebar-gallery-button"
                ariaLabel="View cat photo gallery"
                condition={true}
              />

              {/* Theme Toggle */}
              <ThemeToggleActionItem
                onClick={onThemeChange}
                isLightTheme={isLightTheme}
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
  isLightTheme: PropTypes.bool.isRequired,
  onThemeChange: PropTypes.func.isRequired,
  onOpenSuggestName: PropTypes.func,
  onOpenPhotos: PropTypes.func,
};
