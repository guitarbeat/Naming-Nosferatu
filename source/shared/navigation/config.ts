import { BarChart2, CheckCircle, Compass, Image, Trophy } from "lucide-react";
import type { NavItemConfig } from "./types";

/**
 * Main navigation items - flat structure for SPA
 * Each item maps directly to a route without submenus
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    key: "tournament",
    label: "Play",
    shortLabel: "Play",
    icon: CheckCircle,
    type: "primary",
    ariaLabel: "Play the tournament",
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
export const BOTTOM_NAV_ITEMS: string[] = ["tournament", "analyze"];
