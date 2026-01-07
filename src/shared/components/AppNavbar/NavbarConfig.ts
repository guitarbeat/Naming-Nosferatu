import { MAIN_NAV_ITEMS } from "../../../config/navigation.config";
import type { BuildNavItemsContext, NavItem } from "./navbarCore";

export function buildNavItems(context: BuildNavItemsContext): NavItem[] {
	const { view, isAnalysisMode, onToggleAnalysis, currentRoute, onNavigate } = context;

	// Helper to check if a route is active
	// Simple check: exact match or starts with (for nested routes)
	const isRouteActive = (route?: string) => {
		if (!route || !currentRoute) return false;
		if (route === "/") return currentRoute === "/";
		return currentRoute.startsWith(route);
	};

	return MAIN_NAV_ITEMS.map((config) => {
		// Special handling for legacy/hybrid items if needed
		let isActive = isRouteActive(config.route);
		let onClick = () => config.route && onNavigate?.(config.route);

		// Override for Analysis (toggle or route?)
		// Current plan says Analysis is a route "/analysis"
		if (config.key === "analysis") {
			// If we are strictly using routes now:
			// but we might want to keep the toggle behavior if on a specific view?
			// For now, let's respect the config's route.
			// But if the user preserved 'analysis' as a toggle in the implementation plan...
			// The plan said: "Analysis will transition from a simple toggle to a context-aware feature... accessed via specific routes"
			// So we use the route.

			// If we want to keep the "toggle" behavior when ON the tournament page, we might need extra logic.
			// But simply navigating to /analysis is cleaner.
		}

		// Legacy view support fallback (optional, can be removed if fully switched)
		if (config.key === "gallery" && view === "photos") isActive = true;
		if (config.key === "analysis" && isAnalysisMode) isActive = true;

		return {
			key: config.key,
			label: config.label,
			shortLabel: config.shortLabel,
			icon: config.icon,
			ariaLabel: config.label,
			isActive,
			onClick,
		};
	});
}
