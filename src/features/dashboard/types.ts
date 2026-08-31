import type { ChangeEvent, ElementType } from "react";
import type { NameItem, RatingData } from "@/shared/types";

export interface LeaderboardEntry {
	name: string;
	total_ratings: number;
	wins: number;
	avg_rating: number;
	losses?: number;
	percentile_rank?: number;
}

export interface QuickStat {
	accent?: boolean;
	icon: ElementType;
	label: string;
	value: string | number;
}

export interface DashboardProps {
	personalRatings?: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew?: () => void;
	onUpdateRatings?: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName?: string;
	isAdmin?: boolean;
	isLoggedIn?: boolean;
	avatarUrl?: string;
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
}

export interface UnifiedDashboardProps extends DashboardProps {}

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

export type DashboardView = "analytics" | "moderation";

export interface AdminStatsGridProps {
	stats: AdminStats;
}

export interface AdminNamesTabProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
	filteredNames: NameWithStats[];
	onToggleHidden: (nameId: string | number, isHidden: boolean) => void;
	onToggleLocked: (nameId: string | number, isLocked: boolean) => void;
	onDelete: (nameId: string | number) => void;
}
