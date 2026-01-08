/**
 * @module navigation
 * @description Barrel exports for the navigation system
 *
 * This module provides a single entry point for all navigation-related
 * types, configuration, transformation functions, context, and hooks.
 */

// Configuration
export { BOTTOM_NAV_ITEMS, MAIN_NAV_ITEMS, UTILITY_NAV_ITEMS } from "./config";
// Context and provider
export { NavbarContext, NavbarProvider, useNavbarContext } from "./context";
// Hooks
export {
	type NavbarDimensions,
	useAnalysisMode,
	useMobileMenu,
	useNavbarCollapse,
	useNavbarDimensions,
	useToggleAnalysis,
} from "./hooks";
// Transform functions
export { buildNavItems, findNavItem, getBottomNavItems } from "./transform";
// Types
export type {
	BuildNavItemsContext,
	NavbarContextValue,
	NavItem,
	NavItemConfig,
	NavItemType,
} from "./types";
