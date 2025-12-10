/**
 * @module AppNavbar
 * @description Main application navigation bar component - always horizontal
 * Fully consolidated for simplicity
 */
import {
  useCallback,
  useMemo,
  useId,
  useState,
  useRef,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import LiquidGlass from "../LiquidGlass";
import ThemeSwitch from "../ThemeSwitch";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";

// ============================================================================
// Constants
// ============================================================================

const MOBILE_MENU_ID = "app-navbar-mobile-panel";

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "⚙️" },
];

// ============================================================================
// Styles
// ============================================================================

const NAVBAR_STYLES = `
/* ============================================================================
   NAVBAR - HORIZONTAL LAYOUT ONLY
   ============================================================================ */

/* Glass Container */
.app-navbar-glass {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky, 1020);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 4vw, 2.5rem);
  pointer-events: none;
  overflow: visible;
  transition: height 0.3s ease, padding 0.3s ease;
}

.app-navbar-glass--collapsed {
  height: auto;
  min-height: 64px;
  padding: clamp(0.5rem, 1.2vw, 0.75rem) clamp(1rem, 4vw, 2.5rem);
  overflow: visible;
}

/* Main Navbar Container */
.app-navbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: clamp(0.5rem, 1.2vw, 0.875rem);
  width: 100%;
  max-width: 1400px;
  min-height: 56px;
  padding: clamp(0.75rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem);
  border-radius: 24px;
  border: 1px solid hsl(var(--border) / 40%);
  background: linear-gradient(
    135deg,
    hsl(var(--background) / 85%) 0%,
    hsl(var(--background) / 92%) 50%,
    hsl(var(--background) / 85%) 100%
  );
  box-shadow:
    0 4px 24px hsl(var(--foreground) / 8%),
    0 2px 8px hsl(var(--foreground) / 4%),
    inset 0 1px 0 hsl(var(--foreground) / 6%);
  pointer-events: auto;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.app-navbar--collapsed {
  min-height: 56px;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.75rem, 2vw, 1rem);
  opacity: 0.98;
  overflow: visible;
}

.app-navbar--collapsed > :not(.app-navbar__collapse-toggle) {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  max-width: 0;
  max-height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app-navbar--collapsed .app-navbar__collapse-toggle {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/* Collapse Toggle - Hamburger Menu */
.app-navbar__collapse-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border-radius: 10px;
  border: 1px solid hsl(var(--border) / 40%);
  background: hsl(var(--background) / 70%);
  color: hsl(var(--foreground) / 90%);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    0 2px 8px hsl(var(--foreground) / 8%),
    0 0 8px hsl(var(--foreground) / 4%),
    inset 0 1px 0 hsl(var(--foreground) / 6%);
}

.app-navbar__collapse-toggle:hover {
  background: hsl(var(--background) / 85%);
  border-color: hsl(var(--border) / 60%);
  transform: translateY(-1px);
  box-shadow:
    0 4px 10px hsl(var(--foreground) / 12%),
    0 0 12px hsl(var(--foreground) / 6%),
    inset 0 1px 0 hsl(var(--foreground) / 8%);
}

.app-navbar__collapse-toggle:active {
  transform: translateY(0) scale(0.95);
  box-shadow:
    0 1px 4px hsl(var(--foreground) / 8%),
    0 0 6px hsl(var(--foreground) / 4%),
    inset 0 1px 0 hsl(var(--foreground) / 6%);
}

.app-navbar__collapse-toggle:focus-visible {
  outline: 2px solid hsl(var(--neon-cyan) / 70%);
  outline-offset: 2px;
  border-radius: 10px;
}

.app-navbar__collapse-toggle--collapsed,
.app-navbar--collapsed .app-navbar__collapse-toggle,
.app-navbar-glass--collapsed .app-navbar__collapse-toggle {
  background: hsl(var(--background) / 80%);
  border-color: hsl(var(--neon-cyan) / 50%);
  box-shadow:
    0 2px 8px hsl(var(--neon-cyan) / 20%),
    0 0 12px hsl(var(--neon-cyan) / 15%),
    inset 0 1px 0 hsl(var(--foreground) / 8%);
}

.app-navbar__collapse-toggle--collapsed:hover,
.app-navbar--collapsed .app-navbar__collapse-toggle:hover,
.app-navbar-glass--collapsed .app-navbar__collapse-toggle:hover {
  background: hsl(var(--background) / 90%);
  border-color: hsl(var(--neon-cyan) / 70%);
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px hsl(var(--neon-cyan) / 30%),
    0 0 16px hsl(var(--neon-cyan) / 20%),
    inset 0 1px 0 hsl(var(--foreground) / 10%);
}

.app-navbar__collapse-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-navbar__collapse-hamburger {
  width: 20px;
  height: 20px;
  transition: all 0.2s ease;
}

/* Brand Button */
.app-navbar__brand {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  border: 1px solid hsl(var(--border) / 30%);
  background: hsl(var(--background) / 60%);
  color: hsl(var(--foreground));
  font-size: clamp(0.875rem, 1vw, 1rem);
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.app-navbar__brand:hover {
  background: hsl(var(--background) / 80%);
  border-color: hsl(var(--border) / 50%);
  transform: translateY(-1px);
}

.app-navbar__brand[data-active="true"] {
  background: linear-gradient(
    135deg,
    hsl(var(--neon-cyan) / 20%) 0%,
    hsl(var(--hot-pink) / 15%) 100%
  );
  border-color: hsl(var(--neon-cyan) / 40%);
  box-shadow: 0 2px 8px hsl(var(--neon-cyan) / 20%);
}

.app-navbar__brand small {
  font-size: 0.7em;
  font-weight: 500;
  opacity: 0.7;
  margin-top: 0.125rem;
}

/* Navigation Links */
.app-navbar__link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  border: 1px solid hsl(var(--border) / 25%);
  background: hsl(var(--background) / 50%);
  color: hsl(var(--foreground) / 90%);
  font-size: clamp(0.8125rem, 0.9vw, 0.9375rem);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-navbar__link:hover {
  background: hsl(var(--background) / 70%);
  border-color: hsl(var(--border) / 40%);
  color: hsl(var(--foreground));
  transform: translateY(-1px);
}

.app-navbar__link[data-active="true"] {
  background: linear-gradient(
    135deg,
    hsl(var(--neon-cyan) / 25%) 0%,
    hsl(var(--hot-pink) / 20%) 100%
  );
  border-color: hsl(var(--neon-cyan) / 50%);
  color: hsl(var(--foreground));
  box-shadow:
    0 2px 8px hsl(var(--neon-cyan) / 25%),
    inset 0 1px 0 hsl(var(--foreground) / 10%);
}

.app-navbar__link-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

/* Action Buttons */
.app-navbar__action-button,
.app-navbar__user-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 10px;
  border: 1px solid hsl(var(--border) / 25%);
  background: hsl(var(--background) / 50%);
  color: hsl(var(--foreground) / 90%);
  font-size: clamp(0.8125rem, 0.9vw, 0.9375rem);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.app-navbar__action-button:hover,
.app-navbar__user-button:hover {
  background: hsl(var(--background) / 70%);
  border-color: hsl(var(--border) / 40%);
  color: hsl(var(--foreground));
  transform: translateY(-1px);
}

.app-navbar__action-button[data-icon-only="true"] {
  padding: 0;
  min-width: 2.5rem;
}

.app-navbar__action-label {
  font-size: clamp(0.8125rem, 0.9vw, 0.9375rem);
  font-weight: 500;
}

.app-navbar__logout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* User Display */
.navbar-user-display {
  display: flex;
  align-items: center;
  min-width: 0;
}

.navbar-user-display__content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  width: 100%;
}

.navbar-user-display__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  min-width: 0;
  overflow: hidden;
}

.navbar-user-display__name {
  font-size: clamp(0.8125rem, 0.9vw, 0.9375rem);
  font-weight: 600;
  color: hsl(var(--foreground) / 95%);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.navbar-user-display__admin-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: hsl(var(--neon-cyan));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
}

/* Mobile Menu Toggle */
.app-navbar__toggle {
  display: none;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  border: 1px solid hsl(var(--border) / 30%);
  background: hsl(var(--background) / 60%);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.app-navbar__toggle:hover {
  background: hsl(var(--background) / 80%);
  border-color: hsl(var(--border) / 50%);
}

.app-navbar__toggle span {
  display: block;
  width: 18px;
  height: 2px;
  background: hsl(var(--foreground) / 90%);
  border-radius: 2px;
  transition: all 0.2s ease;
}

.app-navbar__toggle span:not(:last-child) {
  margin-bottom: 4px;
}

/* Mobile Menu */
.app-navbar__mobile {
  position: fixed;
  top: calc(clamp(0.75rem, 2vw, 1.25rem) + 56px + 0.5rem);
  left: clamp(1rem, 4vw, 2.5rem);
  right: clamp(1rem, 4vw, 2.5rem);
  max-width: 500px;
  max-height: calc(100vh - 120px);
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid hsl(var(--border) / 40%);
  background: linear-gradient(
    135deg,
    hsl(var(--background) / 95%) 0%,
    hsl(var(--background) / 98%) 100%
  );
  backdrop-filter: blur(12px) saturate(1.1);
  box-shadow:
    0 8px 32px hsl(var(--foreground) / 12%),
    0 4px 16px hsl(var(--foreground) / 8%);
  overflow-y: auto;
  z-index: 1022;
  pointer-events: auto;
  transform: translateY(-10px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-navbar__mobile[data-open="true"] {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.app-navbar__mobile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  border: 1px solid hsl(var(--border) / 25%);
  background: hsl(var(--background) / 60%);
  color: hsl(var(--foreground) / 90%);
  font-size: 0.9375rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.app-navbar__mobile-link:last-child {
  margin-bottom: 0;
}

.app-navbar__mobile-link:hover {
  background: hsl(var(--background) / 80%);
  border-color: hsl(var(--border) / 40%);
  transform: translateX(4px);
}

.app-navbar__mobile-link[data-active="true"] {
  background: linear-gradient(
    135deg,
    hsl(var(--neon-cyan) / 25%) 0%,
    hsl(var(--hot-pink) / 20%) 100%
  );
  border-color: hsl(var(--neon-cyan) / 50%);
  color: hsl(var(--foreground));
}

/* Dropdown Menus */
.app-navbar__dropdown {
  min-width: 180px;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid hsl(var(--border) / 40%);
  background: linear-gradient(
    135deg,
    hsl(var(--background) / 98%) 0%,
    hsl(var(--background) / 95%) 100%
  );
  box-shadow:
    0 8px 24px hsl(var(--foreground) / 10%),
    0 4px 12px hsl(var(--foreground) / 6%);
}

.app-navbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  color: hsl(var(--foreground) / 90%);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.app-navbar__dropdown-item:hover {
  background: hsl(var(--background) / 80%);
}

.app-navbar__dropdown-item[data-active="true"] {
  background: hsl(var(--accent) / 15%);
  color: hsl(var(--accent));
}

.app-navbar__dropdown-item--logout {
  color: hsl(var(--destructive));
}

.app-navbar__dropdown-item--logout:hover {
  background: hsl(var(--destructive) / 10%);
}

/* Responsive Design */
@media (width <= 960px) {
  .app-navbar {
    gap: clamp(0.375rem, 1vw, 0.625rem);
    padding: clamp(0.625rem, 1.2vw, 0.875rem) clamp(0.75rem, 1.5vw, 1.25rem);
  }

  .app-navbar__link,
  .app-navbar__action-button:not(.app-navbar__toggle),
  .app-navbar__user-button {
    display: none;
  }

  .app-navbar__toggle {
    display: flex;
  }

  .app-navbar__brand small {
    display: none;
  }

  .app-navbar__collapse-toggle {
    width: 2.5rem;
    height: 2.5rem;
  }

  .app-navbar__collapse-hamburger {
    width: 18px;
    height: 18px;
  }
}

@media (width <= 640px) {
  .app-navbar-glass {
    padding: 0.625rem 1rem;
  }

  .app-navbar {
    padding: 0.625rem 0.875rem;
    min-height: 48px;
  }

  .app-navbar__brand {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}

@media (width <= 480px) {
  .app-navbar__mobile {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}

/* Accessibility & Performance */
.app-navbar__link:focus-visible,
.app-navbar__brand:focus-visible,
.app-navbar__action-button:focus-visible,
.app-navbar__user-button:focus-visible,
.app-navbar__toggle:focus-visible,
.app-navbar__collapse-toggle:focus-visible {
  outline: 2px solid hsl(var(--neon-cyan) / 70%);
  outline-offset: 2px;
}

.app-navbar__link,
.app-navbar__brand,
.app-navbar__action-button,
.app-navbar__user-button {
  contain: layout style paint;
}

@media (prefers-reduced-motion: reduce) {
  .app-navbar,
  .app-navbar-glass,
  .app-navbar__link,
  .app-navbar__brand,
  .app-navbar__action-button,
  .app-navbar__user-button,
  .app-navbar__toggle,
  .app-navbar__collapse-toggle,
  .app-navbar__mobile {
    transition: none;
  }
}
`;

// ============================================================================
// Icon Components
// ============================================================================

function Icon({ children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

const PhotosIcon = () => (
  <Icon>
    <path d="M4 8a3 3 0 0 1 3-3h2l1.2-1.6a1 1 0 0 1 .8-.4h4a1 1 0 0 1 .8.4L18 5h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
    <circle cx="12" cy="11" r="2.6" />
    <path
      d="m4 16 4.5-4 2.5 2.5L14 11l6 5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M17 7.5h.01" strokeWidth="2.4" strokeLinecap="round" />
  </Icon>
);

const AnalysisIcon = () => (
  <Icon>
    <path d="M4 20V6" />
    <path d="M20 20H4" />
    <path d="m6 14 3.5-4 3 3 5.5-6" />
    <circle cx="9.5" cy="10" r="1.6" fill="currentColor" opacity="0.35" />
    <circle cx="17.5" cy="7" r="1.6" fill="currentColor" opacity="0.35" />
    <path d="M18 4v3h3" />
  </Icon>
);

const SuggestIcon = () => (
  <Icon>
    <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1Z" />
    <path d="M21 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
    <path d="M3 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
    <path d="M18.36 4.64a1 1 0 0 0-1.41 1.41 1 1 0 0 0 1.41-1.41Z" />
    <path d="M7.05 4.64a1 1 0 0 0-1.41-1.41 1 1 0 0 0 1.41 1.41Z" />
    <path d="M12 7a5 5 0 0 1 5 5c0 2.5-2.5 3.5-5 3.5s-5-1-5-3.5a5 5 0 0 1 5-5Z" />
    <path d="M9 18a3 3 0 0 0 6 0" />
  </Icon>
);

const LogoutIcon = () => (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </Icon>
);

// ============================================================================
// Navigation Configuration
// ============================================================================

function buildNavItems(context) {
  const { view, isAnalysisMode, onOpenPhotos, onToggleAnalysis } = context;

  return [
    {
      key: "gallery",
      label: "Gallery",
      shortLabel: "Photos",
      icon: PhotosIcon,
      ariaLabel: "Open cat photo gallery",
      isActive: view === "photos",
      onClick: () => onOpenPhotos?.(),
    },
    {
      key: "analysis",
      label: "Analysis Mode",
      shortLabel: "Analysis",
      icon: AnalysisIcon,
      ariaLabel: isAnalysisMode
        ? "Disable analysis mode"
        : "Enable analysis mode",
      isActive: Boolean(isAnalysisMode),
      onClick: () => onToggleAnalysis?.(),
    },
  ];
}

// ============================================================================
// UI Components
// ============================================================================

function BrandButton({ isActive, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-navbar__brand"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
    >
      Tournament
      <small>Daily bracket</small>
    </button>
  );
}

BrandButton.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

function NavLink({ item, onClick, className, showIcon = true }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={className}
      data-active={item.isActive}
      aria-current={item.isActive ? "page" : undefined}
      aria-label={item.ariaLabel || item.label}
      title={item.label}
    >
      {showIcon && Icon && (
        <Icon className="app-navbar__link-icon" aria-hidden="true" />
      )}
      {item.shortLabel || item.label}
    </button>
  );
}

NavLink.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    shortLabel: PropTypes.string,
    ariaLabel: PropTypes.string,
    icon: PropTypes.elementType,
    isActive: PropTypes.bool.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  showIcon: PropTypes.bool,
};

function NavbarCollapseToggle({ isCollapsed, onToggle }) {
  return (
    <button
      type="button"
      className={`app-navbar__collapse-toggle ${
        isCollapsed ? "app-navbar__collapse-toggle--collapsed" : ""
      }`}
      onClick={onToggle}
      aria-label={isCollapsed ? "Show navigation bar" : "Hide navigation bar"}
      aria-expanded={!isCollapsed}
      aria-controls="app-navbar"
      title={isCollapsed ? "Show navigation" : "Hide navigation"}
    >
      <span className="app-navbar__collapse-icon" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="app-navbar__collapse-hamburger"
        >
          {isCollapsed ? (
            // X icon when collapsed
            <>
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            // Hamburger icon when expanded
            <>
              <path
                d="M3 12h18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 6h18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 18h18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </span>
    </button>
  );
}

NavbarCollapseToggle.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function MobileMenuToggle({ isOpen, onToggle }) {
  return (
    <button
      type="button"
      className="app-navbar__toggle"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls={MOBILE_MENU_ID}
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

MobileMenuToggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function MobileMenu({
  isOpen,
  navItems,
  homeIsActive,
  onHomeClick,
  onNavClick,
  menuRef,
}) {
  return (
    <nav
      ref={menuRef}
      id={MOBILE_MENU_ID}
      className="app-navbar__mobile"
      data-open={isOpen}
      aria-label="Mobile primary navigation"
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onHomeClick}
        className="app-navbar__mobile-link"
        data-active={homeIsActive}
        aria-current={homeIsActive ? "page" : undefined}
        aria-label="Go to Tournament home"
      >
        Tournament
      </button>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavClick(item)}
            className="app-navbar__mobile-link"
            data-active={item.isActive}
            aria-current={item.isActive ? "page" : undefined}
            aria-label={item.ariaLabel || item.label}
            title={item.label}
          >
            {Icon && (
              <Icon className="app-navbar__link-icon" aria-hidden="true" />
            )}
            {item.shortLabel || item.label}
          </button>
        );
      })}
    </nav>
  );
}

MobileMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      shortLabel: PropTypes.string,
      ariaLabel: PropTypes.string,
      icon: PropTypes.elementType,
      isActive: PropTypes.bool.isRequired,
    })
  ).isRequired,
  homeIsActive: PropTypes.bool.isRequired,
  onHomeClick: PropTypes.func.isRequired,
  onNavClick: PropTypes.func.isRequired,
  menuRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
};

function UserDisplay({ userName, isAdmin = false }) {
  if (!userName) return null;

  const MAX_DISPLAY_LENGTH = 18;
  const truncatedUserName =
    userName && userName.length > MAX_DISPLAY_LENGTH
      ? `${userName.substring(0, MAX_DISPLAY_LENGTH)}...`
      : userName;

  return (
    <div className="navbar-user-display">
      <div className="navbar-user-display__content">
        <div className="navbar-user-display__text">
          <span className="navbar-user-display__name">{truncatedUserName}</span>
          {isAdmin && (
            <span
              className="navbar-user-display__admin-label"
              aria-label="Admin"
            >
              Admin
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

UserDisplay.propTypes = {
  userName: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool,
};

function UserLogoutButton({ userName, isAdmin, onLogout }) {
  return (
    <button
      type="button"
      className="app-navbar__user-button"
      onClick={onLogout}
      aria-label={`Log out ${userName}`}
      title="Log out"
    >
      <UserDisplay userName={userName} isAdmin={isAdmin} />
      <span className="app-navbar__logout-icon" aria-hidden="true">
        <LogoutIcon />
      </span>
    </button>
  );
}

UserLogoutButton.propTypes = {
  userName: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool,
  onLogout: PropTypes.func.isRequired,
};

function ThemeDropdown({ themePreference, currentTheme, onThemeChange }) {
  const themeIcon =
    currentTheme === "dark" ? "🌙" : currentTheme === "light" ? "☀️" : "⚙️";

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="light"
          className="app-navbar__action-button"
          data-icon-only="true"
          aria-label={`Theme: ${themePreference}. Currently ${currentTheme}`}
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
            textValue={option.label}
            className="app-navbar__dropdown-item"
            data-active={themePreference === option.key}
            onPress={() => onThemeChange(option.key)}
          >
            {option.icon} {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

ThemeDropdown.propTypes = {
  themePreference: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
  onThemeChange: PropTypes.func.isRequired,
};

function SuggestButton({ onPress, isDisabled, showLabel = false }) {
  return (
    <Button
      isIconOnly={!showLabel}
      size="sm"
      radius="full"
      variant="light"
      className="app-navbar__action-button"
      data-icon-only={!showLabel}
      aria-label="Suggest a new cat name"
      title="Suggest a new cat name"
      onPress={onPress}
      isDisabled={isDisabled}
    >
      <SuggestIcon />
      {showLabel && <span className="app-navbar__action-label">Suggest</span>}
    </Button>
  );
}

SuggestButton.propTypes = {
  onPress: PropTypes.func,
  isDisabled: PropTypes.bool,
  showLabel: PropTypes.bool,
};

// ============================================================================
// Custom Hooks
// ============================================================================

function useAnalysisMode() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get("analysis") === "true"
    );
  }, []);
}

function useToggleAnalysis() {
  return useCallback(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const isAnalysisMode = search.get("analysis") === "true";

    if (isAnalysisMode) {
      search.delete("analysis");
    } else {
      search.set("analysis", "true");
    }

    const next = search.toString();
    window.history.pushState({}, "", next ? `${path}?${next}` : path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
}

function useNavbarCollapse(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return { isCollapsed, toggle };
}

function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle escape key to close menu
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && isOpen) {
        close();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  // Handle outside click to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest(".app-navbar__toggle")
      ) {
        close();
      }
    }

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isOpen, close]);

  return { isOpen, toggle, close, menuRef };
}

// ============================================================================
// Main Component
// ============================================================================

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
  currentRoute,
  onNavigate,
}) {
  const navbarGlassId = useId();
  const {
    isOpen: isMobileMenuOpen,
    toggle: toggleMobileMenu,
    close: closeMobileMenu,
    menuRef,
  } = useMobileMenu();
  const { isCollapsed, toggle: toggleCollapse } = useNavbarCollapse(false);
  const isAnalysisMode = useAnalysisMode();
  const toggleAnalysis = useToggleAnalysis();

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
    (fn) => {
      return (...args) => {
        closeMobileMenu();
        void Promise.resolve(fn?.(...args));
      };
    },
    [closeMobileMenu]
  );

  const handleNavClick = useCallback(
    (item) => {
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
  const handleSuggest = createHandler(onOpenSuggestName);
  const handleLogout = createHandler(onLogout);

  const homeIsActive = view === "tournament" && !isAnalysisMode;
  const navbarRef = useRef(null);
  const [navbarDimensions, setNavbarDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: 80,
  });

  // Update navbar dimensions on resize and when collapsed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateDimensions = () => {
      if (navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        setNavbarDimensions({
          width: window.innerWidth,
          height: isCollapsed ? 0 : Math.max(rect.height, 56),
        });
      } else {
        setNavbarDimensions({
          width: window.innerWidth,
          height: isCollapsed ? 0 : 80,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [isCollapsed]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAVBAR_STYLES }} />
      <LiquidGlass
        id={`navbar-glass-${navbarGlassId.replace(/:/g, "-")}`}
        className={`app-navbar-glass app-navbar--horizontal ${
          isCollapsed ? "app-navbar-glass--collapsed" : ""
        }`}
        width={navbarDimensions.width}
        height={navbarDimensions.height}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
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
          <NavbarCollapseToggle
            isCollapsed={isCollapsed}
            onToggle={toggleCollapse}
          />
          <BrandButton
            isActive={homeIsActive}
            onClick={handleHomeClick}
            ariaLabel="Go to Tournament home"
          />

          {navItems.map((item) => (
            <NavLink
              key={item.key}
              item={item}
              onClick={handleNavClick}
              className="app-navbar__link"
            />
          ))}

          <SuggestButton
            onPress={handleSuggest}
            isDisabled={!onOpenSuggestName}
            showLabel={true}
          />

          {onThemeToggle ? (
            <ThemeSwitch currentTheme={currentTheme} onToggle={onThemeToggle} />
          ) : (
            <ThemeDropdown
              themePreference={themePreference}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          )}

          {isLoggedIn && userName && (
            <UserLogoutButton
              userName={userName}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          )}

          <MobileMenuToggle
            isOpen={isMobileMenuOpen}
            onToggle={toggleMobileMenu}
          />

          <MobileMenu
            isOpen={isMobileMenuOpen}
            navItems={navItems}
            homeIsActive={homeIsActive}
            onHomeClick={handleHomeClick}
            onNavClick={handleNavClick}
            menuRef={menuRef}
          />
        </header>
      </LiquidGlass>
    </>
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
  onThemeToggle: PropTypes.func,
  onOpenSuggestName: PropTypes.func,
  onOpenPhotos: PropTypes.func,
  currentRoute: PropTypes.string,
  onNavigate: PropTypes.func,
};

export default AppNavbar;
