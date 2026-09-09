import { getActiveNames, getHiddenNames, getLockedNames, matchesNameSearchTerm } from "@/lib/names";
import type { NameItem } from "@/types";
import type { AdminStats, NameFilter, NameWithStats, SiteStatsLike } from "./types";

export const FILTER_OPTIONS: readonly { value: NameFilter; label: string }[] = [
	{ value: "all", label: "All Names" },
	{ value: "active", label: "Active" },
	{ value: "hidden", label: "Hidden" },
	{ value: "locked", label: "Locked In" },
];

export function mapNameToDisplay(name: NameItem): NameWithStats {
	return { ...name };
}

export function buildAdminStats(
	names: NameWithStats[],
	siteStats: SiteStatsLike | null,
): AdminStats {
	return {
		totalNames: names.length,
		activeNames: getActiveNames(names).length,
		hiddenNames: getHiddenNames(names).length,
		lockedInNames: getLockedNames(names).length,
		totalUsers: (siteStats?.totalUsers as number) || 0,
		recentVotes: (siteStats?.totalRatings as number) || 0,
	};
}

export function filterNamesByStatusAndSearch(
	names: NameWithStats[],
	filterStatus: NameFilter,
	searchTerm: string,
): NameWithStats[] {
	let filtered = names;
	if (filterStatus === "active") {
		filtered = getActiveNames(names);
	} else if (filterStatus === "hidden") {
		filtered = getHiddenNames(names);
	} else if (filterStatus === "locked") {
		filtered = getLockedNames(names);
	}

	if (searchTerm) {
		filtered = filtered.filter((n) => matchesNameSearchTerm(n, searchTerm));
	}
	return filtered;
}

export function getQuickStats({ siteStats, userStats }: any) {
	return [
		{ label: "Total Users", value: siteStats?.totalUsers || 0 },
		{ label: "Total Ratings", value: siteStats?.totalRatings || 0 },
		{ label: "Your Ratings", value: userStats?.ratingsCount || 0 },
	];
}
