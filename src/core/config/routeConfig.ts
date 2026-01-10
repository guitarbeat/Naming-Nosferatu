/**
 * @module routeConfig
 * @description Centralized route configuration for SPA routing
 * Maps route paths to view states and component keys
 */

// Route path constants
export const ROUTES = {
	HOME: "/",
	TOURNAMENT: "/tournament",
	RESULTS: "/results",
	GALLERY: "/gallery",
	ANALYSIS: "/analysis",
	LOGIN: "/login",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

// View states that map to routes
export type ViewState = "login" | "tournament" | "results" | "gallery" | "analysis" | "photos";

// Route configuration with metadata
export interface RouteConfig {
	path: RoutePath;
	view: ViewState;
	requiresAuth: boolean;
	lazyComponent: string; // Key for lazy loading
	title: string;
}

export const ROUTE_CONFIGS: RouteConfig[] = [
	{
		path: ROUTES.HOME,
		view: "tournament",
		requiresAuth: false,
		lazyComponent: "TournamentSetup",
		title: "Cat Name Tournament",
	},
	{
		path: ROUTES.TOURNAMENT,
		view: "tournament",
		requiresAuth: false,
		lazyComponent: "TournamentSetup",
		title: "Tournament Setup",
	},
	{
		path: ROUTES.RESULTS,
		view: "results",
		requiresAuth: true,
		lazyComponent: "Dashboard",
		title: "Results",
	},
	{
		path: ROUTES.GALLERY,
		view: "gallery",
		requiresAuth: true,
		lazyComponent: "GalleryView",
		title: "Photo Gallery",
	},
	{
		path: ROUTES.ANALYSIS,
		view: "analysis",
		requiresAuth: true,
		lazyComponent: "Dashboard",
		title: "Analysis",
	},
	{
		path: ROUTES.LOGIN,
		view: "login",
		requiresAuth: false,
		lazyComponent: "TournamentSetup",
		title: "Login",
	},
];

/**
 * Get route config by path
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
	const normalizedPath = path.split("?")[0]?.split("#")[0] || "/";
	return ROUTE_CONFIGS.find((config) => config.path === normalizedPath);
}

/**
 * Get route config by view state
 */
export function getRouteByView(view: ViewState): RouteConfig | undefined {
	return ROUTE_CONFIGS.find((config) => config.view === view);
}

/**
 * Check if path requires authentication
 */
export function requiresAuth(path: string): boolean {
	const config = getRouteConfig(path);
	return config?.requiresAuth ?? false;
}

/**
 * Valid tournament-related paths
 */
export const TOURNAMENT_PATHS = new Set<string>([
	ROUTES.HOME,
	ROUTES.TOURNAMENT,
	ROUTES.RESULTS,
	ROUTES.GALLERY,
	ROUTES.ANALYSIS,
]);

/**
 * Check if path is a valid app route
 */
export function isValidRoute(path: string): boolean {
	const normalizedPath = path.split("?")[0]?.split("#")[0] || "/";
	return ROUTE_CONFIGS.some((config) => config.path === normalizedPath);
}
