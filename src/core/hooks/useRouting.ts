// @ts-nocheck
/**
 * @module useRouting
 * @description Simple URL-based routing hook for handling different routes
 */
import { useState, useEffect, useCallback } from "react";

const ROUTE_CHANGE_EVENT = "app-routing-change";

const getBrowserRoute = () =>
  window.location.pathname + window.location.search + window.location.hash;

const broadcastRouteChange = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  } catch (_error) {
    if (
      typeof document !== "undefined" &&
      typeof document.createEvent === "function"
    ) {
      const fallbackEvent = document.createEvent("Event");
      fallbackEvent.initEvent(ROUTE_CHANGE_EVENT, false, false);
      window.dispatchEvent(fallbackEvent);
    }
  }
};

export function useRouting() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== "undefined") {
      return getBrowserRoute();
    }
    return "/";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleRouteChange = () => {
      setCurrentRoute(getBrowserRoute());
    };

    // Listen for browser navigation (back/forward buttons)
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
    };
  }, []);

  const sanitizeRoute = useCallback((route) => {
    if (!route) return "/";

    if (route.startsWith("http://") || route.startsWith("https://")) {
      try {
        const { pathname, search, hash } = new URL(route);
        return `${pathname}${search}${hash}` || "/";
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Invalid URL provided to navigateTo:", error);
        }
        return "/";
      }
    }

    if (route.startsWith("/")) {
      return route;
    }

    return `/${route}`;
  }, []);

  const navigateTo = useCallback(
    (route, options = {}) => {
      const sanitizedRoute = sanitizeRoute(route);

      if (typeof window === "undefined") {
        setCurrentRoute(sanitizedRoute);
        return;
      }

      const { replace = false } = options;

      const fullPath = sanitizedRoute;

      if (getBrowserRoute() === fullPath) {
        setCurrentRoute(fullPath);
        broadcastRouteChange();
        return;
      }

      const historyMethod = replace ? "replaceState" : "pushState";

      window.history[historyMethod]({}, "", fullPath);
      setCurrentRoute(fullPath);
      broadcastRouteChange();
    },
    [sanitizeRoute],
  );

  const isRoute = useCallback(
    (route) => {
      const sanitizedRoute = sanitizeRoute(route);
      return currentRoute === sanitizedRoute;
    },
    [currentRoute, sanitizeRoute],
  );

  return {
    currentRoute,
    navigateTo,
    isRoute,
  };
}
