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
        className={`app-navbar-glass app-navbar--horizontal ${
          isCollapsed ? "app-navbar-glass--collapsed" : ""
        }`}
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
