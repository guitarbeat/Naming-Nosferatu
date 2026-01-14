/**
 * @module routeConfig
 * @description Centralized route configuration for SPA routing.
 * Provides route constants and utility functions for route validation.
 */

// Route path constants
export const ROUTES = {
	HOME: "/",
	TOURNAMENT: "/tournament",
	RESULTS: "/results",
	GALLERY: "/gallery",
	ANALYSIS: "/analysis",
	EXPLORE: "/explore",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Valid tournament-related paths
 */
export const TOURNAMENT_PATHS = new Set<string>([
	ROUTES.HOME,
	ROUTES.TOURNAMENT,
	ROUTES.RESULTS,
	ROUTES.GALLERY,
	ROUTES.ANALYSIS,
	ROUTES.EXPLORE,
]);

/**
 * Check if path is a valid app route
 */
export function isValidRoute(path: string): boolean {
	const normalizedPath = path.split("?")[0]?.split("#")[0] || "/";
	return TOURNAMENT_PATHS.has(normalizedPath);
}

/**
 * Normalize a route path by removing query params and fragments
 */
export function normalizeRoutePath(path: string): string {
	return path.split("?")[0]?.split("#")[0] || "/";
}
