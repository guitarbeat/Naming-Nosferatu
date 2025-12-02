import { useEffect, useMemo, useRef } from "react";
import { normalizeRoutePath } from "@utils/navigationUtils";

const TOURNAMENT_PATHS = new Set(["/", "/tournament", "/results"]);

export function useTournamentRoutingSync({
  currentRoute,
  navigateTo,
  isLoggedIn,
  currentView,
  onViewChange,
  isTournamentComplete,
}) {
  const normalizedPath = useMemo(
    () => normalizeRoutePath(currentRoute),
    [currentRoute],
  );

  const previousRouteRef = useRef(null);
  const lastViewRef = useRef(currentView);
  const lastCompletionRef = useRef(isTournamentComplete);

  useEffect(() => {
    if (!isLoggedIn || normalizedPath === "/bongo") {
      lastViewRef.current = currentView;
      lastCompletionRef.current = isTournamentComplete;
      return;
    }

    const completionChanged =
      isTournamentComplete !== lastCompletionRef.current;
    lastCompletionRef.current = isTournamentComplete;

    if (!completionChanged && currentView === lastViewRef.current) {
      return;
    }

    // * Store previous view before updating the ref
    lastViewRef.current = currentView;

    if (currentView === "profile") {
      if (normalizedPath !== "/profile") {
        navigateTo("/profile");
      }
      return;
    }

    // * Allow "photos" view to stay on tournament paths
    if (currentView === "photos") {
      if (!TOURNAMENT_PATHS.has(normalizedPath)) {
        navigateTo("/");
      }
      return;
    }

    if (isTournamentComplete && currentView === "tournament") {
      if (normalizedPath !== "/results") {
        navigateTo("/results");
      }
      return;
    }

    if (!TOURNAMENT_PATHS.has(normalizedPath)) {
      navigateTo("/tournament");
    }
  }, [
    currentView,
    isLoggedIn,
    isTournamentComplete,
    navigateTo,
    normalizedPath,
  ]);

  useEffect(() => {
    if (normalizedPath === "/bongo") {
      previousRouteRef.current = currentRoute;
      return;
    }

    if (!isLoggedIn) {
      if (normalizedPath !== "/login") {
        navigateTo("/login", { replace: true });
      }
      previousRouteRef.current = currentRoute;
      return;
    }

    if (normalizedPath === "/profile" && currentView !== "profile") {
      lastViewRef.current = "profile";
      onViewChange("profile");
      previousRouteRef.current = currentRoute;
      return;
    }

    const previousPath = normalizeRoutePath(previousRouteRef.current);
    const pathChanged =
      previousRouteRef.current === null || previousPath !== normalizedPath;

    // * Allow "photos" view on tournament paths - don't reset it to "tournament"
    const allowedTournamentViews = new Set(["tournament", "photos"]);

    if (
      pathChanged &&
      TOURNAMENT_PATHS.has(normalizedPath) &&
      !allowedTournamentViews.has(currentView)
    ) {
      lastViewRef.current = "tournament";
      onViewChange("tournament");
    }

    previousRouteRef.current = currentRoute;
  }, [
    currentRoute,
    currentView,
    isLoggedIn,
    navigateTo,
    normalizedPath,
    onViewChange,
  ]);

  return normalizedPath;
}
