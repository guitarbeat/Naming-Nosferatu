/**
 * @module AppSidebar
 * @description Application navbar navigation component (rendered as horizontal navbar, not sidebar)
 */

import PropTypes from "prop-types";
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "../ui/sidebar";
import { MenuNavItem } from "./MenuNavItem";
import { MenuActionItem } from "./MenuActionItem";
import { ThemeToggleActionItem } from "./ThemeToggleActionItem";
import { NavbarSection } from "./NavbarSection";
import { UserDisplay } from "./components/UserDisplay";
import { TournamentIcon, LogoutIcon, PhotosIcon } from "./icons";
import { AnalysisToggle } from "../AnalysisPanel";
import { useRouting } from "@hooks/useRouting";
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
}) {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { navigateTo } = useRouting();

  // * Check if analysis mode is currently active
  const isAnalysisMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("analysis") === "true";

  // * Define navigation items - data-driven approach
  const navItems = [
    {
      key: "tournament",
      label: "Tournament",
      icon: TournamentIcon,
    },
  ];

  const handleLogoClick = () => {
    // * Toggle navbar collapse/expand on logo/avatar click
    toggleCollapsed();
  };

  const logoButtonLabel = collapsed
    ? "Expand sidebar and go to home page"
    : "Collapse sidebar and go to home page";

  return (
    <Sidebar className="app-sidebar" collapsible>
      {/* * Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {collapsed ? "Navbar collapsed" : "Navbar expanded"}
      </div>
      <div className="navbar-content">
        {/* Left Section: Logo + Navigation */}
        <NavbarSection className="navbar-left">
          {/* Logo Section */}
          <div className="sidebar-logo">
            <button
              type="button"
              onClick={handleLogoClick}
              className="sidebar-logo-button"
              aria-label={logoButtonLabel}
              title={logoButtonLabel}
            >
              <video
                className="sidebar-logo-video"
                width="96"
                height="96"
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
                  width="96"
                  height="96"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  style={{ display: "none" }}
                />
              </video>
            </button>
          </div>

          {/* Main Navigation */}
          <SidebarGroup open={true}>
            <SidebarGroupContent>
              {navItems.map((item) => (
                <MenuNavItem
                  key={item.key}
                  itemKey={item.key}
                  icon={item.icon}
                  label={item.label}
                  view={view}
                  onClick={setView}
                />
              ))}
              {/* Analysis Mode Toggle - uses intentional AnalysisToggle component */}
              {isLoggedIn && userName && (
                <AnalysisToggle
                  active={isAnalysisMode}
                  collapsed={collapsed}
                  onClick={() => {
                    // * Toggle analysis mode via URL parameter
                    const currentPath = window.location.pathname;
                    const currentSearch = new URLSearchParams(
                      window.location.search,
                    );

                    if (isAnalysisMode) {
                      currentSearch.delete("analysis");
                    } else {
                      currentSearch.set("analysis", "true");
                    }

                    const newSearch = currentSearch.toString();
                    const newUrl = newSearch
                      ? `${currentPath}?${newSearch}`
                      : currentPath;

                    navigateTo(newUrl);
                  }}
                />
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </NavbarSection>

        {/* Right Section: Actions */}
        <NavbarSection className="navbar-right" alignRight>
          {/* Actions Section */}
          <SidebarGroup open={true}>
            <SidebarGroupContent>
              {/* Theme Toggle */}
              <ThemeToggleActionItem
                onClick={onThemeChange}
                isLightTheme={isLightTheme}
              />

              {/* Logout */}
              <MenuActionItem
                icon={LogoutIcon}
                label="Logout"
                onClick={onLogout}
                className="sidebar-logout-button"
                condition={isLoggedIn}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {/* User Display - After actions */}
          {isLoggedIn && userName && (
            <UserDisplay userName={userName} isAdmin={isAdmin} />
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
};
