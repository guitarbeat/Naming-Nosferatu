/**
 * @module useNavbarIndicator
 * @description Custom hook for managing navbar sliding indicator position and animation
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * * Custom hook for managing navbar indicator position
 * @param {Object} options - Configuration options
 * @param {number} options.indicatorSize - Size of the indicator in pixels
 * @param {string} options.view - Current active view
 * @param {boolean} options.isAnalysisMode - Whether analysis mode is active
 * @param {string} options.currentRoute - Current route path
 * @returns {Object} Indicator state and ref for navigation container
 */
export function useNavbarIndicator({
  indicatorSize = 14,
  view,
  isAnalysisMode,
  currentRoute,
}) {
  const navRef = useRef(null);
  const resizeRafRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, opacity: 0 });

  // * Update sliding indicator position with optimized performance
  const updateIndicator = useCallback(() => {
    if (!navRef.current) return;

    const activeItem = navRef.current.querySelector('[data-active="true"]');
    if (!activeItem) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // * Center the indicator under the active item
    const targetLeft =
      itemRect.left - navRect.left + itemRect.width / 2 - indicatorSize / 2;

    setIndicator({ left: targetLeft, opacity: 1 });
  }, [indicatorSize]);

  // * Handle window resize with debouncing and RAF optimization
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      // * Clear existing timeout and RAF
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      // * Debounce resize with timeout, then use RAF for smooth updates
      resizeTimeoutRef.current = setTimeout(() => {
        if (resizeRafRef.current) return;
        resizeRafRef.current = requestAnimationFrame(() => {
          resizeRafRef.current = null;
          updateIndicator();
        });
      }, 100);
    };

    // * Initial update
    const initialRafId = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      cancelAnimationFrame(initialRafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateIndicator]);

  // * Refresh indicator on view/mode/route change
  useEffect(() => {
    const rafId = requestAnimationFrame(updateIndicator);
    return () => cancelAnimationFrame(rafId);
  }, [view, isAnalysisMode, currentRoute, updateIndicator]);

  return { navRef, indicator, indicatorSize };
}
