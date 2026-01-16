import { BarChart2, CheckCircle, Compass, Image, Trophy } from "lucide-react";
import type { NavItemConfig } from "./types";

/**
 * Main navigation items - flat structure for SPA
 * Each item maps directly to a route without submenus
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
	{
		key: "tournament",
		label: "Vote",
		shortLabel: "Vote",
		icon: CheckCircle,
		type: "primary",
		ariaLabel: "Vote on cat names",
	},
	{
		key: "results",
		label: "Results",
		shortLabel: "Results",
		icon: Trophy,
		type: "primary",
		ariaLabel: "View your tournament results",
	},
	{
		key: "analysis",
		label: "Analytics",
		shortLabel: "Stats",
		icon: BarChart2,
		type: "primary",
		ariaLabel: "View global analytics",
	},
	{
		key: "gallery",
		label: "Gallery",
		shortLabel: "Gallery",
		icon: Image,
		type: "primary",
		ariaLabel: "Browse cat gallery",
	},
	{
		key: "explore",
		label: "Explore",
		shortLabel: "Explore",
		icon: Compass,
		type: "primary",
		ariaLabel: "Explore cat names",
	},
];

/**
 * Utility navigation items (profile, settings, etc.)
 */
export const UTILITY_NAV_ITEMS: NavItemConfig[] = [];

/**
 * Bottom navigation item keys (mobile) - show core actions
 */
export const BOTTOM_NAV_ITEMS: string[] = ["tournament", "results", "gallery", "explore"];
