import { MAIN_NAV_ITEMS } from "../../../config/navigation.config";
import type { BuildNavItemsContext, NavItem } from "./navbarCore";
import type { NavItemConfig } from "../../../config/navigation.config";

export function buildNavItems(context: BuildNavItemsContext, items: NavItemConfig[] = MAIN_NAV_ITEMS): NavItem[] {
	const { currentRoute, onNavigate } = context;

	// Helper to check if a route is active
	// Simple check: exact match or starts with (for nested routes)
	const isRouteActive = (route?: string) => {
		if (!route || !currentRoute) return false;
		if (route === "/") return currentRoute === "/";
		return currentRoute.startsWith(route);
	};

	return items.map((config) => {
		// Special handling for legacy/hybrid items if needed
		let isActive = isRouteActive(config.route);
		let onClick = () => config.route && onNavigate?.(config.route);

		return {
			key: config.key,
			label: config.label,
			icon: config.icon,
			ariaLabel: config.label,
			isActive,
			onClick,
			children: config.children ? buildNavItems(context, config.children) : undefined,
		};
	});
}
