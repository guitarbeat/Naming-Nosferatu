import { BarChart2, CheckCircle, Compass, Image, Trophy } from "lucide-react";
import type { NavItemConfig } from "./types";

/**
 * Main navigation items - now view-key based instead of route-based
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
	{
		key: "tournament",
		label: "Vote",
		icon: CheckCircle,
		type: "primary",
		children: [
			{
				key: "vote",
				label: "Vote",
				type: "secondary",
			},
		],
	},
	{
		key: "results",
		label: "Results",
		icon: Trophy,
		type: "primary",
		children: [
			{
				key: "overview",
				label: "Overview",
				type: "secondary",
			},
			{
				key: "leaderboard",
				label: "Leaderboard",
				type: "secondary",
			},
			{
				key: "matchups",
				label: "Matchup History",
				type: "secondary",
			},
		],
	},
	{
		key: "analysis",
		label: "Analyze Data",
		icon: BarChart2,
		type: "primary",
		children: [
			{
				key: "global",
				label: "Global Trends",
				type: "secondary",
			},
			{
				key: "cats",
				label: "Cat Analytics",
				type: "secondary",
			},
		],
	},
	{
		key: "gallery",
		label: "Browse Gallery",
		icon: Image,
		type: "primary",
		children: [
			{
				key: "grid",
				label: "Grid View",
				type: "secondary",
			},
		],
	},
	{
		key: "explore",
		label: "Explore",
		icon: Compass,
		type: "primary",
		children: [
			{
				key: "stats",
				label: "Statistics",
				type: "secondary",
			},
			{
				key: "photos",
				label: "Photos",
				type: "secondary",
			},
		],
	},
];

/**
 * Utility navigation items (profile, settings, etc.)
 */
export const UTILITY_NAV_ITEMS: NavItemConfig[] = [];

/**
 * Bottom navigation item keys (mobile)
 */
export const BOTTOM_NAV_ITEMS: string[] = ["tournament", "results", "explore"];
