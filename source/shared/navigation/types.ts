import type { ComponentType } from "react";

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
