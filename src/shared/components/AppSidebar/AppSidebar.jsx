/**
 * @module AppSidebar
 * @description Application sidebar navigation component
 */

import PropTypes from "prop-types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from "../ui/sidebar";
import { MenuNavItem } from "./MenuNavItem";
import { MenuActionItem } from "./MenuActionItem";
import { ThemeToggleActionItem } from "./ThemeToggleActionItem";
import { NavbarSection } from "./NavbarSection";
import {
  TournamentIcon,
  ProfileIcon,
  DashboardIcon,
  LogoutIcon,
  UserIcon,
  AdminIcon,
} from "./icons";
import "./AppSidebar.css";

export function AppSidebar({
  view,
  setView,
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onStartNewTournament,
  isLightTheme,
  onThemeChange,
  onTogglePerformanceDashboard,
  breadcrumbItems: _breadcrumbItems = [],
}) {
  const { collapsed, toggleCollapsed } = useSidebar();

  // * Allow sidebar to expand/collapse freely regardless of login state
  // useEffect(() => {
  //   if (!isLoggedIn && !collapsed) {
  //     toggleCollapsed();
  //   }
  // }, [collapsed, isLoggedIn, toggleCollapsed]);

  // * Define navigation items - data-driven approach
  const navItems = [
    {
      key: "tournament",
      label: "Tournament",
      icon: TournamentIcon,
    },
    // * Add Profile if logged in
    ...(isLoggedIn ? [{ key: "profile", label: "Profile", icon: ProfileIcon }] : []),
  ];

  const handleLogoClick = () => {
    // * Toggle sidebar expansion/collapse
    console.log('Sidebar clicked, current collapsed state:', collapsed);
    toggleCollapsed();

    // * If expanding, also navigate to tournament
    if (collapsed) {
      setView("tournament");
      if (typeof onStartNewTournament === "function") {
        onStartNewTournament();
      }
    }
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
      <SidebarContent>
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
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && breadcrumbItems.length > 0 && (
          <div className="navbar-breadcrumb">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}
        </NavbarSection>

        {/* Right Section: User Info + Actions */}
        <NavbarSection className="navbar-right" alignRight>
        {/* User Info Section */}
        {isLoggedIn && userName && !collapsed && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-greeting">
                <UserIcon />
              <span>Welcome, {userName}</span>
            </div>
            {/* * Admin Badge for Aaron */}
            {isAdmin && userName && userName.toLowerCase() === "aaron" && (
              <div className="sidebar-admin-badge">
                  <AdminIcon />
                  <span>Admin</span>
              </div>
            )}
          </div>
        )}

        {/* Actions Section */}
        <SidebarGroup open={true}>
          <SidebarGroupContent>
            <SidebarMenu>
                {/* Performance Dashboard - Admin only */}
                <MenuActionItem
                  icon={DashboardIcon}
                  label="Dashboard"
                  onClick={onTogglePerformanceDashboard}
                  ariaLabel="Open performance dashboard"
                  condition={isLoggedIn && isAdmin && !!onTogglePerformanceDashboard}
                />

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </NavbarSection>
      </SidebarContent>
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
  onTogglePerformanceDashboard: PropTypes.func,
  breadcrumbItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
    })
  ),
};
