/**
 * @module AppNavbar
 * @description Fully custom navigation bar built on HeroUI primitives for actions only.
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
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
const MOBILE_MENU_ID = "app-navbar-mobile-panel";
const DESKTOP_BREAKPOINT = 960;

/**
 * Main App Navbar component powered by a custom layout layer.
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
      view,
      currentRoute,
      isAnalysisMode,
      onOpenPhotos,
      onNavigate,
      handleAnalysisToggle,
    ],
  );

  // * Close the tray before navigating so focus does not get trapped
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
    if (typeof action === "function") {
      action();
    }
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [view, currentRoute, isAnalysisMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth > DESKTOP_BREAKPOINT && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen || typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const themeIcon =
    currentTheme === "dark" ? "🌙" : currentTheme === "light" ? "☀️" : "⚙️";

  const homeIsActive = view === "tournament" && !isAnalysisMode;

  const renderHomeButton = (variant = "desktop") => (
    <button
      type="button"
      onClick={handleHomeClick}
      className={
        variant === "mobile"
          ? "app-navbar__mobile-link app-navbar__mobile-home"
          : "app-navbar__brand-button"
      }
      data-active={homeIsActive}
      aria-current={homeIsActive ? "page" : undefined}
      aria-label="Go to Tournament home"
      title="Tournament view"
    >
      <div className="app-navbar__brand-icon">
        <video
          className="app-navbar__brand-video"
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
      <span className="app-navbar__brand-text">
        <span className="app-navbar__brand-title">Tournament</span>
        <span className="app-navbar__brand-subtitle">Daily bracket</span>
      </span>
    </button>
  );

  const renderNavButton = (item, variant = "desktop") => {
    const Icon = item.icon;
    const className =
      variant === "mobile" ? "app-navbar__mobile-link" : "app-navbar__link";
    const labelClass =
      variant === "mobile"
        ? "app-navbar__mobile-link-label"
        : "app-navbar__link-label";

    return (
      <button
        key={`${variant}-${item.key}`}
        type="button"
        onClick={() => handleNavItemClick(item)}
        className={className}
        data-active={item.isActive}
        aria-current={item.isActive ? "page" : undefined}
        aria-label={item.ariaLabel || item.label}
        title={item.label}
      >
        {Icon && (
          <span className="app-navbar__link-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
        <span className={labelClass}>{item.label}</span>
      </button>
    );
  };

  return (
    <LiquidGlass
      width={1240}
      height={110}
      radius={26}
      scale={-160}
      saturation={1.05}
      frost={0.08}
      inputBlur={9}
      outputBlur={0.85}
      className="app-navbar-glass"
      style={{ width: "100%", height: "auto", minHeight: "92px" }}
    >
      <header className="app-navbar" role="banner">
        <div className="app-navbar__row">
          <div className="app-navbar__brand">{renderHomeButton()}</div>

          <nav className="app-navbar__links" aria-label="Primary navigation">
            {navItems.map((item) => renderNavButton(item))}
          </nav>

          <div className="app-navbar__utilities">
            <Button
              isIconOnly
              size="sm"
              radius="full"
              variant="light"
              className="app-navbar__icon-button"
              aria-label="Suggest a new cat name"
              title="Suggest a name"
              onPress={onOpenSuggestName}
              isDisabled={!onOpenSuggestName}
            >
              <SuggestIcon />
            </Button>

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  className="app-navbar__icon-button"
                  aria-label={`Theme: ${themePreference}. Currently ${currentTheme}`}
                  title="Choose a theme"
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
                    className="app-navbar__dropdown-item"
                    data-active={themePreference === option.key}
                    onPress={() => onThemePreferenceChange(option.key)}
                  >
                    <span className="app-navbar__dropdown-icon">
                      {option.icon}
                    </span>
                    <span>{option.label}</span>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {isLoggedIn && userName ? (
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button
                    variant="light"
                    radius="full"
                    className="app-navbar__user-button"
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
                    <span className="app-navbar__dropdown-user">{userName}</span>
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    className="app-navbar__dropdown-item app-navbar__dropdown-item--logout"
                    onPress={onLogout}
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : null}

            <button
              type="button"
              className="app-navbar__toggle"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
              aria-controls={MOBILE_MENU_ID}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div
          id={MOBILE_MENU_ID}
          className="app-navbar__mobile-panel"
          data-open={isMobileMenuOpen}
        >
          <nav
            className="app-navbar__mobile-links"
            aria-label="Mobile primary navigation"
          >
            {renderHomeButton("mobile")}
            {navItems.map((item) => renderNavButton(item, "mobile"))}
          </nav>

          <div className="app-navbar__mobile-actions">
            <p className="app-navbar__mobile-heading">Quick actions</p>

            <button
              type="button"
              className="app-navbar__mobile-action"
              onClick={() => handleMobileAction(onOpenSuggestName)}
              disabled={!onOpenSuggestName}
            >
              <span className="app-navbar__mobile-action-icon" aria-hidden="true">
                <SuggestIcon />
              </span>
              <span>Suggest a name</span>
            </button>

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
                  <span aria-hidden="true">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            {isLoggedIn && userName ? (
              <div className="app-navbar__mobile-user">
                <UserDisplay userName={userName} isAdmin={isAdmin} />
                <button
                  type="button"
                  className="app-navbar__mobile-action app-navbar__mobile-action--logout"
                  onClick={() => handleMobileAction(onLogout)}
                >
                  <span aria-hidden="true">
                    <LogoutIcon />
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
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
