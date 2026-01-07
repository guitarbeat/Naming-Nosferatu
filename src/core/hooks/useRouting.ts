/**
 * @module useRouting
 * @description Routing hooks for URL-based navigation and tournament routing synchronization
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeRoutePath } from "../../shared/utils/core";

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

interface UseKeyboardShortcutsProps {
	onAnalysisToggle: () => void;
	navigateTo: (path: string) => void;
}

export function useKeyboardShortcuts({ onAnalysisToggle, navigateTo }: UseKeyboardShortcutsProps) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// * Analysis Mode toggle (Ctrl+Shift+A or Cmd+Shift+A)
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "A") {
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
					const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;

					navigateTo(newUrl);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onAnalysisToggle, navigateTo]);
}

// ============================================================================
// Core Routing Hook
// ============================================================================

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
		if (typeof document !== "undefined" && typeof document.createEvent === "function") {
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

	const sanitizeRoute = useCallback((route: string) => {
		if (!route) {
			return "/";
		}

		if (route.startsWith("http://") || route.startsWith("https://")) {
			try {
				const { pathname, search, hash } = new URL(route);
				return `${pathname}${search}${hash}` || "/";
			} catch (error) {
				if (import.meta.env.DEV) {
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
		(route: string, options: { replace?: boolean } = {}) => {
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
		(route: string) => {
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

// ============================================================================
// Tournament Routing Sync Hook
// ============================================================================

const TOURNAMENT_PATHS = new Set(["/", "/tournament", "/results", "/gallery", "/analysis"]);

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
	const normalizedPath = useMemo(() => normalizeRoutePath(currentRoute), [currentRoute]);

	const previousRouteRef = useRef<string | null>(null);
	const lastViewRef = useRef(currentView);
	const lastCompletionRef = useRef(isTournamentComplete);

	useEffect(() => {
		if (!isLoggedIn || normalizedPath === "/bongo") {
			lastViewRef.current = currentView;
			lastCompletionRef.current = isTournamentComplete;
			return;
		}

		const completionChanged = isTournamentComplete !== lastCompletionRef.current;
		lastCompletionRef.current = isTournamentComplete;

		if (!completionChanged && currentView === lastViewRef.current) {
			return;
		}

		// * Store previous view before updating the ref
		lastViewRef.current = currentView;

		if (currentView === "profile") {
			// Redirect profile view to tournament with analysis mode
			const targetPath = "/tournament?analysis=true";
			if (normalizedPath !== "/tournament" || !currentRoute.includes("analysis=true")) {
				navigateTo(targetPath);
			}
			return;
		}

		// * Allow "photos" view to stay on tournament paths
		if (currentView === "photos") {
			if (!TOURNAMENT_PATHS.has(normalizedPath)) {
				// Redirect legacy view state to new route if not on a valid path
				navigateTo("/gallery");
			} else if (normalizedPath === "/" || normalizedPath === "/tournament") {
				// If on home but view is photos, sync URL
				navigateTo("/gallery", { replace: true });
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
	}, [currentRoute, currentView, isLoggedIn, isTournamentComplete, navigateTo, normalizedPath]);

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
		const pathChanged = previousRouteRef.current === null || previousPath !== normalizedPath;

		// * Allow "photos" view on tournament paths - don't reset it to "tournament"
		const allowedTournamentViews = new Set(["tournament", "photos"]);

		// Explicit route-to-view mapping
		if (pathChanged) {
			if (normalizedPath === "/gallery" && currentView !== "photos") {
				lastViewRef.current = "photos";
				onViewChange("photos");
				previousRouteRef.current = currentRoute;
				return;
			}

			if (normalizedPath === "/analysis" && currentView !== "analysis") {
				// If we have a dedicated analysis view state
				// or we just rely on dashboard + analysis param?
				// The plan says Analysis is a route.
				// If currentView is used for this, set it.
				// But ViewRouter uses URL param for analysis mode.
				// Let's assume for now we might leave it or set a view if needed.
			}
		}

		// * Allow "photos" view on tournament paths - don't reset it to "tournament"
		const allowedTournamentViews = new Set(["tournament", "photos"]);

		if (
			pathChanged &&
			TOURNAMENT_PATHS.has(normalizedPath) &&
			!allowedTournamentViews.has(currentView) &&
			normalizedPath !== "/gallery" // Don't reset if we just handled gallery above
		) {
			lastViewRef.current = "tournament";
			onViewChange("tournament");
		}

		previousRouteRef.current = currentRoute;
	}, [currentRoute, currentView, isLoggedIn, navigateTo, normalizedPath, onViewChange]);

	return normalizedPath;
}
