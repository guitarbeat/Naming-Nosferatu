import {
	AnalysisIcon,
	PhotosIcon,
	TrophyIcon,
	VoteIcon,
} from "../components/AppNavbar/NavbarIcons";
import type { NavItemConfig } from "./types";

/**
 * Main navigation items
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
	{
		key: "tournament",
		label: "Vote Now",
		route: "/",
		icon: VoteIcon,
		type: "primary",
		children: [
			{
				key: "vote",
				label: "Vote",
				route: "/",
				type: "secondary",
			},
		],
	},
	{
		key: "results",
		label: "View Results",
		route: "/results",
		icon: TrophyIcon,
		type: "primary",
		children: [
			{
				key: "overview",
				label: "Overview",
				route: "/results",
				type: "secondary",
			},
			{
				key: "leaderboard",
				label: "Leaderboard",
				route: "/results/leaderboard",
				type: "secondary",
			},
			{
				key: "matchups",
				label: "Matchup History",
				route: "/results/matchups",
				type: "secondary",
			},
		],
	},
	{
		key: "analysis",
		label: "Analyze Data",
		route: "/analysis",
		icon: AnalysisIcon,
		type: "primary",
		children: [
			{
				key: "global",
				label: "Global Trends",
				route: "/analysis",
				type: "secondary",
			},
			{
				key: "cats",
				label: "Cat Analytics",
				route: "/analysis/cats",
				type: "secondary",
			},
		],
	},
	{
		key: "gallery",
		label: "Browse Gallery",
		route: "/gallery",
		icon: PhotosIcon,
		type: "primary",
		children: [
			{
				key: "grid",
				label: "Grid View",
				route: "/gallery",
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
export const BOTTOM_NAV_ITEMS: string[] = ["tournament", "results", "analysis", "gallery"];
