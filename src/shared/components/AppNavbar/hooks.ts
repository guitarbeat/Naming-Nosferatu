/**
 * @module AppNavbar/hooks
 * @description Custom hooks for navbar functionality
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { useCollapsible } from "../../hooks/useCollapsible";
import { STORAGE_KEYS } from "../../../core/constants";

const ANALYSIS_QUERY_PARAM = "analysis";

export function useAnalysisMode() {
  const [isAnalysisMode, setIsAnalysisMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get(ANALYSIS_QUERY_PARAM) === "true"
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function checkAnalysisModeFromUrl() {
      const isActive =
        new URLSearchParams(window.location.search).get(ANALYSIS_QUERY_PARAM) === "true";
      setIsAnalysisMode(isActive);
    }

    checkAnalysisModeFromUrl();
    window.addEventListener("popstate", checkAnalysisModeFromUrl);
    window.addEventListener("locationchange", checkAnalysisModeFromUrl);

    return () => {
      window.removeEventListener("popstate", checkAnalysisModeFromUrl);
      window.removeEventListener("locationchange", checkAnalysisModeFromUrl);
    };
  }, []);

  return isAnalysisMode;
}

export function useToggleAnalysis() {
  return useCallback(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const isActive = searchParams.get(ANALYSIS_QUERY_PARAM) === "true";

    if (isActive) {
      searchParams.delete(ANALYSIS_QUERY_PARAM);
    } else {
      searchParams.set(ANALYSIS_QUERY_PARAM, "true");
    }

    const updatedSearchString = searchParams.toString();
    const newUrl = updatedSearchString
      ? `${currentPath}?${updatedSearchString}`
      : currentPath;
    window.history.pushState({}, "", newUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
}

export function useNavbarCollapse(defaultCollapsed = false) {
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    STORAGE_KEYS.NAVBAR_COLLAPSED,
    defaultCollapsed
  );

  return { isCollapsed, toggle: toggleCollapsed };
}

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle escape key and body scroll lock
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        close();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const menu = document.getElementById("app-navbar-mobile-panel");
      const toggle = target.closest(".app-navbar__toggle");

      if (menu && !menu.contains(target) && !toggle) {
        close();
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, close]);

  return { isOpen, toggle, close };
}

interface NavbarDimensions {
  width: number;
  height: number;
}

export function useNavbarDimensions(isCollapsed: boolean) {
  const navbarRef = useRef<HTMLElement>(null);
  const [dimensions, setDimensions] = useState<NavbarDimensions>({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: 80,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    function updateDimensions() {
      if (navbarRef.current) {
        const rect = navbarRef.current.getBoundingClientRect();
        // When collapsed, use actual navbar width (just the toggle button)
        // When expanded, use full window width
        setDimensions({
          width: isCollapsed ? Math.max(rect.width, 64) : window.innerWidth,
          height: isCollapsed ? Math.max(rect.height, 56) : Math.max(rect.height, 56),
        });
      } else {
        // Fallback: when collapsed, use minimal width for toggle button
        setDimensions({
          width: isCollapsed ? 64 : window.innerWidth,
          height: isCollapsed ? 56 : 80,
        });
      }
    }

    const frameId = requestAnimationFrame(updateDimensions);
    window.addEventListener("resize", updateDimensions);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [isCollapsed]);

  return { navbarRef, dimensions };
}
