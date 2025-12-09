/**
 * @module useNavbarMenu
 * @description Custom hook for managing navbar mobile menu state and accessibility
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * * Custom hook for managing mobile menu state with accessibility features
 * @param {Object} options - Configuration options
 * @param {string} options.view - Current active view
 * @param {string} options.currentRoute - Current route path
 * @param {boolean} options.isAnalysisMode - Whether analysis mode is active
 * @returns {Object} Menu state and handlers
 */
export function useNavbarMenu({ view, currentRoute, isAnalysisMode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  // * Close menu when navigation changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [view, currentRoute, isAnalysisMode]);

  // * Handle Escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
        // * Return focus to menu button for better UX
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  // * Trap focus within menu when open (accessibility)
  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return undefined;

    const menu = menuRef.current;
    const focusableElements = menu.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    menu.addEventListener("keydown", handleTabKey);
    // * Focus first element when menu opens
    firstElement?.focus();

    return () => {
      menu.removeEventListener("keydown", handleTabKey);
    };
  }, [isMenuOpen]);

  // * Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isMenuOpen]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return {
    isMenuOpen,
    toggleMenu,
    closeMenu,
    menuButtonRef,
    menuRef,
  };
}
