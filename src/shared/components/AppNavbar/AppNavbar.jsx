/**
 * @module AppNavbar (HeroUI Navbar)
 * @description Navigation bar powered by @heroui/react primitives to reduce
 * bespoke layout logic and keep the component lean.
 */

import { useMemo, useCallback, useState } from "react";
import PropTypes from "prop-types";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import LiquidGlass from "../LiquidGlass";
import { UserDisplay } from "./components/UserDisplay";
import { LogoutIcon, SuggestIcon } from "./icons";
import { buildNavItems } from "./navConfig";
import "./Navbar.css";

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "⚙️" },
];

/**
 * Main App Navbar component powered by HeroUI primitives.
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

  // * Detect analysis mode from query string so menu state matches the route
  const isAnalysisMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("analysis") === "true"
      : false;

  // * Toggle analysis mode from any nav surface
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

  // * Keep the indicator logic simple by letting the router define active links
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
    ],
  );

  // * Close the HeroUI drawer before navigating
  const handleNavItemClick = useCallback(
    (item) => {
      setIsMobileMenuOpen(false);
      if (typeof item.onClick === "function") {
        item.onClick();
        return;
      }
      setView(item.key);
    },
    [setView],
  );

  const handleHomeClick = useCallback(() => {
    setIsMobileMenuOpen(false);
    setView("tournament");
  }, [setView]);

  const handleMobileAction = useCallback((action) => {
    setIsMobileMenuOpen(false);
    action?.();
  }, []);

  const themeIcon =
    currentTheme === "dark" ? "🌙" : currentTheme === "light" ? "☀️" : "⚙️";

  const homeIsActive = view === "tournament" && !isAnalysisMode;

  const renderHomeButton = (variant = "desktop") => (
    <button
      type="button"
      onClick={
        variant === "mobile"
          ? () => handleMobileAction(handleHomeClick)
          : handleHomeClick
      }
      className={
        variant === "mobile" ? "navbar-mobile-link" : "navbar-home-button"
      }
      data-active={homeIsActive}
      aria-current={homeIsActive ? "page" : undefined}
      aria-label="Go to Tournament home"
      title="Tournament"
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
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallbackImg = event.currentTarget.nextElementSibling;
            if (fallbackImg) fallbackImg.style.display = "block";
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
  );

  const renderNavButton = (item, variant = "desktop") => {
    const Icon = item.icon;
    const className =
      variant === "mobile" ? "navbar-mobile-link" : "navbar-menu-button";
    const labelClass =
      variant === "mobile" ? "navbar-mobile-link__label" : "nav-item-label";

    return (
      <button
        type="button"
        onClick={() =>
          variant === "mobile"
            ? handleMobileAction(() => handleNavItemClick(item))
            : handleNavItemClick(item)
        }
        className={className}
        data-active={item.isActive}
        aria-current={item.isActive ? "page" : undefined}
        aria-label={item.ariaLabel || item.label}
        title={item.label}
      >
        {Icon && (
          <span className="navbar-menu-button__icon">
            <Icon />
          </span>
        )}
        <span className={labelClass}>{item.label}</span>
      </button>
    );
  };

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
      <Navbar
        className="app-navbar"
        shouldHideOnScroll={false}
        isMenuOpen={isMobileMenuOpen}
        onMenuOpenChange={setIsMobileMenuOpen}
        role="navigation"
        aria-label="Primary"
      >
        <NavbarContent justify="start" className="app-navbar__lead">
          <NavbarMenuToggle
            aria-label={
              isMobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            className="app-navbar__menu-toggle"
          />
          <NavbarBrand className="app-navbar__brand">
            {renderHomeButton()}
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent justify="center" className="app-navbar__links" as="div">
          {navItems.map((item) => (
            <NavbarItem key={item.key} className="app-navbar__link-item">
              {renderNavButton(item)}
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end" className="app-navbar__actions" as="div">
          <NavbarItem className="app-navbar__action">
            <Button
              isIconOnly
              size="sm"
              radius="full"
              variant="light"
              className="navbar-icon-button"
              aria-label="Suggest a new cat name"
              title="Suggest a name"
              onPress={() => onOpenSuggestName?.()}
              isDisabled={!onOpenSuggestName}
            >
              <SuggestIcon />
            </Button>
          </NavbarItem>

          <NavbarItem className="app-navbar__action">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  className="navbar-icon-button"
                  aria-label={`Theme: ${themePreference}. Currently ${currentTheme}`}
                  title="Toggle theme"
                >
                  {themeIcon}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Theme selector"
                className="app-navbar__dropdown"
              >
                {THEME_OPTIONS.map((option) => (
                  <DropdownItem
                    key={option.key}
                    data-active={themePreference === option.key}
                    onPress={() => onThemePreferenceChange(option.key)}
                  >
                    <span className="theme-option-icon">{option.icon}</span>
                    <span>{option.label}</span>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>

          {isLoggedIn && userName ? (
            <NavbarItem className="app-navbar__action">
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button
                    variant="light"
                    radius="full"
                    className="navbar-user-button"
                    aria-label={`User menu for ${userName}`}
                  >
                    <UserDisplay userName={userName} isAdmin={isAdmin} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="User menu"
                  className="app-navbar__dropdown"
                >
                  <DropdownItem key="user" isDisabled>
                    <span className="navbar-dropdown__user">{userName}</span>
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    className="navbar-dropdown__logout"
                    onPress={onLogout}
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          ) : null}
        </NavbarContent>

        <NavbarMenu
          id="app-navbar-mobile-menu"
          className="app-navbar__mobile-menu"
        >
          <NavbarMenuItem key="mobile-home">
            {renderHomeButton("mobile")}
          </NavbarMenuItem>
          {navItems.map((item) => (
            <NavbarMenuItem key={`mobile-${item.key}`}>
              {renderNavButton(item, "mobile")}
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem
            key="mobile-actions"
            className="app-navbar__mobile-section"
          >
            <p className="app-navbar__mobile-heading">Quick actions</p>
            <div className="app-navbar__mobile-actions">
              <Button
                variant="flat"
                radius="full"
                className="navbar-mobile-action"
                startContent={<SuggestIcon />}
                onPress={() => handleMobileAction(onOpenSuggestName)}
                isDisabled={!onOpenSuggestName}
              >
                Suggest a name
              </Button>

              <div className="app-navbar__mobile-theme">
                {THEME_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    className="app-navbar__theme-chip"
                    data-active={themePreference === option.key}
                    onClick={() =>
                      handleMobileAction(() =>
                        onThemePreferenceChange(option.key),
                      )
                    }
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>

              {isLoggedIn && userName ? (
                <button
                  type="button"
                  className="navbar-mobile-action navbar-mobile-action--logout"
                  onClick={() => handleMobileAction(onLogout)}
                >
                  <LogoutIcon />
                  <span>Logout</span>
                </button>
              ) : null}
            </div>
          </NavbarMenuItem>
        </NavbarMenu>
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
