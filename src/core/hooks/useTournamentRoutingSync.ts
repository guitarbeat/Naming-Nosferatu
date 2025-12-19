import { useEffect, useMemo, useRef } from "react";
import { normalizeRoutePath } from "../../shared/utils/uiUtils";

const TOURNAMENT_PATHS = new Set(["/", "/tournament", "/results"]);

interface UseTournamentRoutingSyncProps {
  currentRoute: string;
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
  isLoggedIn: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  isTournamentComplete: boolean;
}

export function useTournamentRoutingSync({
  currentRoute,
  navigateTo,
  isLoggedIn,
  currentView,
  onViewChange,
  isTournamentComplete,
}: UseTournamentRoutingSyncProps) {
  const normalizedPath = useMemo(
    () => normalizeRoutePath(currentRoute),
    [currentRoute],
  );

  const previousRouteRef = useRef<string | null>(null);
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
      // Redirect profile view to tournament with analysis mode
      const targetPath = "/tournament?analysis=true";
      if (
        normalizedPath !== "/tournament" ||
        !currentRoute.includes("analysis=true")
      ) {
        navigateTo(targetPath);
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
    currentRoute,
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

    // Handle /profile route redirect to tournament with analysis mode
    if (normalizedPath === "/profile" && currentView !== "profile") {
      lastViewRef.current = "profile";
      onViewChange("profile");
      navigateTo("/tournament?analysis=true", { replace: true });
      previousRouteRef.current = currentRoute;
      return;
    }

    const previousPath = normalizeRoutePath(previousRouteRef.current || "");
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
