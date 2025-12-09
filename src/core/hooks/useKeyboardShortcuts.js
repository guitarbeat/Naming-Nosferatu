/**
 * @module useKeyboardShortcuts
 * @description Custom hook for handling global keyboard shortcuts
 */

import { useEffect } from "react";

/**
 * Hook for managing global keyboard shortcuts
 * @param {Object} options
 * @param {Function} options.onNavbarToggle - Callback for navbar toggle (Ctrl/Cmd+B)
 * @param {Function} options.onAnalysisToggle - Callback for analysis mode toggle (Ctrl/Cmd+Shift+A)
 * @param {Function} options.navigateTo - Navigation function for analysis toggle
 */
export function useKeyboardShortcuts({
  onNavbarToggle,
  onAnalysisToggle,
  navigateTo,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // * Navbar toggle (Ctrl+B or Cmd+B)
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        if (onNavbarToggle) {
          onNavbarToggle();
        } else {
          // * Fallback: dispatch custom event
          const navbarToggleEvent = new CustomEvent("toggleNavbar");
          window.dispatchEvent(navbarToggleEvent);
        }
      }

      // * Analysis Mode toggle (Ctrl+Shift+A or Cmd+Shift+A)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "A"
      ) {
        event.preventDefault();
        if (onAnalysisToggle) {
          onAnalysisToggle();
        } else if (navigateTo) {
          // * Fallback: toggle via URL parameter
          const currentPath = window.location.pathname;
          const currentSearch = new URLSearchParams(window.location.search);
          const isAnalysisMode = currentSearch.get("analysis") === "true";

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
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNavbarToggle, onAnalysisToggle, navigateTo]);
}

export default useKeyboardShortcuts;
