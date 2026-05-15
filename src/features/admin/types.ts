import type { ElementType } from "react";
import type { NameItem } from "@/shared/types";

export type DashboardTab = "overview" | "names" | "users" | "analytics";
export type NameFilter = "all" | "active" | "hidden" | "locked";
export type BulkAction = "hide" | "unhide" | "lock" | "unlock";

export interface AdminStats {
	totalNames: number;
	activeNames: number;
	hiddenNames: number;
	lockedInNames: number;
	totalUsers: number;
	recentVotes: number;
}

export interface NameWithStats extends NameItem {
	votes?: number;
	lastVoted?: string;
	popularityScore?: number;
}

export interface SiteStatsLike {
	totalUsers?: unknown;
	totalRatings?: unknown;
}

export interface StatCell {
	icon: ElementType;
	colorClass: string;
	label: string;
	value: number;
}
