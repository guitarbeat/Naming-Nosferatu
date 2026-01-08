import type { ComponentType } from "react";
import {
	AnalysisIcon,
	PhotosIcon,
	TrophyIcon,
	VoteIcon,
} from "../shared/components/AppNavbar/NavbarIcons";

export type NavItemType = "primary" | "secondary" | "utility"; // Action is a utility

export interface NavItemConfig {
	key: string;
	label: string;
	route?: string; // If missing, it's likely an action
	action?: string; // key for specific action handler
	icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	type: NavItemType;
	permissions?: string[]; // 'admin', 'user', etc.
	children?: NavItemConfig[];
	isExternal?: boolean;
	ariaLabel?: string;
	shortLabel?: string;
}

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

export const UTILITY_NAV_ITEMS: NavItemConfig[] = [
	// Profile/User actions are usually handled separately in the layout,
	// but can be defined here if we want a unified list.
];

export const BOTTOM_NAV_ITEMS: string[] = ["tournament", "results", "analysis", "gallery"];
