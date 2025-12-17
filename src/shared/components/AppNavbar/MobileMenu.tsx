/**
 * @module AppNavbar/MobileMenu
 * @description Mobile navigation menu with focus trap
 */

import { useEffect, useRef } from "react";
import type { NavItem } from "./types";

interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  homeIsActive: boolean;
  onHomeClick: () => void;
  onNavClick: (item: NavItem) => void;
}

export function MobileMenu({
  isOpen,
  navItems,
  homeIsActive,
  onHomeClick,
  onNavClick,
}: MobileMenuProps) {
  const menuRef = useRef<HTMLElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const focusableElements = menu.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    // Focus first element when menu opens
    firstElement?.focus();

    menu.addEventListener("keydown", handleTabKey);
    return () => menu.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  return (
    <nav
      ref={menuRef}
      id="app-navbar-mobile-panel"
      className="app-navbar__mobile"
      data-open={isOpen}
      aria-label="Mobile primary navigation"
      aria-hidden={!isOpen}
    >
      <button
        ref={firstFocusableRef}
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
            {Icon && <Icon className="app-navbar__link-icon" aria-hidden />}
            {item.shortLabel || item.label}
          </button>
        );
      })}
    </nav>
  );
}
