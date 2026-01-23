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
type NavItemType = "primary" | "secondary" | "utility";

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
interface NavItemConfig extends BaseNavItem {
	route?: string; // Navigation route
	action?: string; // Action handler key
	permissions?: string[]; // Required permissions
	children?: NavItemConfig[]; // Nested navigation
	isExternal?: boolean; // External link flag
	shortLabel?: string; // Abbreviated label for mobile
	ariaLabel?: string; // Accessibility label override
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
 * Bottom navigation item keys (mobile) - show core actions
 */
export const BOTTOM_NAV_ITEMS: string[] = ["pick", "play", "analyze"];

// ============================================================================
// TRANSFORMATIONS
// ============================================================================

/**
 * Find a navigation item by key (searches recursively)
 */
function findNavItem(items: NavItemConfig[], key: string): NavItemConfig | undefined {
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
