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
    shortLabel?: string;
    route?: string; // If missing, it's likely an action
    action?: string; // key for specific action handler
    icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    type: NavItemType;
    permissions?: string[]; // 'admin', 'user', etc.
    children?: NavItemConfig[];
    isExternal?: boolean;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
    {
        key: "tournament",
        label: "Vote",
        shortLabel: "Vote",
        route: "/",
        icon: VoteIcon,
        type: "primary",
    },
    {
        key: "results",
        label: "Results",
        shortLabel: "Results",
        route: "/results",
        icon: TrophyIcon,
        type: "primary",
    },
    {
        key: "gallery",
        label: "Gallery",
        shortLabel: "Photos",
        route: "/gallery",
        icon: PhotosIcon,
        type: "primary",
    },
    {
        key: "analysis",
        label: "Analysis",
        shortLabel: "Analysis",
        route: "/analysis", // Using route for deep linking
        icon: AnalysisIcon,
        type: "primary",
    },
];

export const UTILITY_NAV_ITEMS: NavItemConfig[] = [
    // Profile/User actions are usually handled separately in the layout,
    // but can be defined here if we want a unified list.
];

export const BOTTOM_NAV_ITEMS: string[] = [
    "tournament",
    "results",
    "gallery",
    "analysis",
];
