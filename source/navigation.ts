import { BarChart2, CheckCircle, Trophy } from "lucide-react";
import type { ComponentType } from "react";

/**
 * @module navigation
 * @description Centralized navigation system for the application.
 * Consolidates types, configuration, and transformation logic.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Navigation item type classification
 */
export type NavItemType = "primary" | "secondary" | "utility";

/**
 * Base navigation item properties shared by config and runtime
 */
interface BaseNavItem {
	key: string;
	label: string;
	icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	type: NavItemType;
}

/**
 * Configuration for a navigation item (declarative)
 */
export interface NavItemConfig extends BaseNavItem {
	route?: string; // Navigation route
	action?: string; // Action handler key
	permissions?: string[]; // Required permissions
	children?: NavItemConfig[]; // Nested navigation
	isExternal?: boolean; // External link flag
	shortLabel?: string; // Abbreviated label for mobile
	ariaLabel?: string; // Accessibility label override
}

/**
 * Runtime navigation item (with computed state)
 */
export interface NavItem extends BaseNavItem {
	isActive: boolean; // Computed active state
	onClick?: () => void; // Click handler
	children?: NavItem[]; // Transformed children
	ariaLabel: string; // Always present (defaults to label)
}

/**
 * Context for building navigation items
 */
export interface BuildNavItemsContext {
	currentRoute?: string;
	onNavigate?: (route: string) => void;
	onOpenPhotos?: () => void;
	onToggleAnalysis?: () => void;
	isAnalysisMode?: boolean;
}

/**
 * Navigation context value
 */
export interface NavbarContextValue {
	// View state
	view: string;
	setView: (view: string) => void;

	// Analysis mode
	isAnalysisMode: boolean;
	toggleAnalysis: () => void;

	// UI state
	isCollapsed: boolean;
	toggleCollapse: () => void;
	isMobileMenuOpen: boolean;
	toggleMobileMenu: () => void;
	closeMobileMenu: () => void;

	// Actions
	onOpenPhotos?: () => void;
	onOpenSuggestName?: () => void;

	// Auth state
	isLoggedIn: boolean;
	userName?: string;
	isAdmin?: boolean;
	onLogout: () => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Main navigation items - flat structure for SPA
 * Each item maps directly to a route without submenus
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
	{
		key: "pick",
		label: "Pick",
		shortLabel: "Pick",
		icon: CheckCircle,
		type: "primary",
		ariaLabel: "Pick names for the tournament",
	},
	{
		key: "play",
		label: "Play",
		shortLabel: "Play",
		icon: Trophy,
		type: "primary",
		ariaLabel: "Start the tournament",
	},
	{
		key: "analyze",
		label: "Analyze",
		shortLabel: "Analyze",
		icon: BarChart2,
		type: "primary",
		ariaLabel: "Analyze results and discover names",
	},
];

/**
 * Utility navigation items (profile, settings, etc.)
 */
export const UTILITY_NAV_ITEMS: NavItemConfig[] = [];

/**
 * Bottom navigation item keys (mobile) - show core actions
 */
export const BOTTOM_NAV_ITEMS: string[] = ["pick", "play", "analyze"];

// ============================================================================
// TRANSFORMATIONS
// ============================================================================

/**
 * Check if a route is currently active
 */
function isRouteActive(route: string | undefined, currentRoute: string | undefined): boolean {
	if (!route || !currentRoute) {
		return false;
	}
	if (route === "/") {
		return currentRoute === "/";
	}
	return currentRoute.startsWith(route);
}

/**
 * Transform navigation configuration into runtime navigation items
 */
export function buildNavItems(context: BuildNavItemsContext, items: NavItemConfig[]): NavItem[] {
	const { currentRoute, onNavigate } = context;

	return items.map((config) => {
		const isActive = isRouteActive(config.route, currentRoute);

		const onClick =
			config.route && onNavigate
				? () => {
						const route = config.route;
						if (route) {
							onNavigate(route);
						}
					}
				: undefined;

		return {
			key: config.key,
			label: config.label,
			icon: config.icon,
			type: config.type,
			ariaLabel: config.ariaLabel || config.label,
			isActive,
			onClick,
			children: config.children ? buildNavItems(context, config.children) : undefined,
		};
	});
}

/**
 * Find a navigation item by key (searches recursively)
 */
export function findNavItem(items: NavItemConfig[], key: string): NavItemConfig | undefined {
	for (const navItem of items) {
		if (navItem.key === key) {
			return navItem;
		}
		if (navItem.children) {
			const found = findNavItem(navItem.children, key);
			if (found) {
				return found;
			}
		}
	}
	return undefined;
}

/**
 * Get navigation items for bottom nav by keys
 */
export function getBottomNavItems(allItems: NavItemConfig[], keys: string[]): NavItemConfig[] {
	return keys
		.map((key) => findNavItem(allItems, key))
		.filter((item): item is NavItemConfig => Boolean(item));
}
