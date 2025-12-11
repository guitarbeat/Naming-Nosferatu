/**
 * @module AppNavbar
 * @description Main application navigation bar component - refactored for maintainability
 */

import { useCallback, useMemo, useId } from "react";
import LiquidGlass from "../LiquidGlass";
import { NavbarProvider } from "./NavbarContext";
import { NavbarBrand } from "./NavbarBrand";
import { NavbarLink } from "./NavbarLink";
import { NavbarCollapseToggle } from "./NavbarCollapseToggle";
import { NavbarActions } from "./NavbarActions";
import { MobileMenu } from "./MobileMenu";
import { MobileMenuToggle } from "./MobileMenuToggle";
import {
  useAnalysisMode,
  useToggleAnalysis,
  useNavbarCollapse,
  useMobileMenu,
  useNavbarDimensions,
} from "./hooks";
import { buildNavItems } from "./utils";
import type { AppNavbarProps, NavItem } from "./types";
import "./AppNavbar.css";

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
  onThemeToggle,
  onOpenSuggestName,
  onOpenPhotos,
}: AppNavbarProps) {
  const collapsedGlassSize = 72;
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

  const handleThemeChange = createHandler(onThemePreferenceChange);
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
      themePreference,
      currentTheme,
      onThemePreferenceChange: handleThemeChange,
      onThemeToggle,
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
      themePreference,
      currentTheme,
      handleThemeChange,
      onThemeToggle,
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
        className={`app-navbar-glass app-navbar--horizontal ${
          isCollapsed ? "app-navbar-glass--collapsed" : ""
        }`}
        width={isCollapsed ? collapsedGlassSize : dimensions.width}
        height={isCollapsed ? collapsedGlassSize : dimensions.height}
        radius={isCollapsed ? 18 : undefined}
        style={
          isCollapsed
            ? {
                "--navbar-collapsed-size": `${collapsedGlassSize}px`,
                width: collapsedGlassSize,
                height: collapsedGlassSize,
                overflow: "visible",
              }
            : { width: "100%", height: "auto", overflow: "visible" }
        }
        data-orientation="horizontal"
        data-collapsed={isCollapsed}
      >
        <header
          ref={navbarRef}
          id="app-navbar"
          className={`app-navbar app-navbar--horizontal ${
            isCollapsed ? "app-navbar--collapsed" : ""
          }`}
          role="banner"
          data-orientation="horizontal"
          data-collapsed={isCollapsed}
        >
          <NavbarCollapseToggle isCollapsed={isCollapsed} onToggle={toggleCollapse} />

          <NavbarBrand
            isActive={isHomeViewActive}
            onClick={handleHomeClick}
            ariaLabel="Go to Tournament home"
          />

          {navItems.map((item) => (
            <NavbarLink key={item.key} item={item} onClick={handleNavClick} />
          ))}

          <NavbarActions
            isLoggedIn={isLoggedIn}
            userName={userName}
            isAdmin={isAdmin}
            onLogout={handleLogout}
            onOpenSuggestName={onOpenSuggestName}
            themePreference={themePreference}
            currentTheme={currentTheme}
            onThemePreferenceChange={handleThemeChange}
            onThemeToggle={onThemeToggle}
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

export default AppNavbar;
