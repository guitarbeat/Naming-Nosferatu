import {
	getActiveNames,
	getHiddenNames,
	getLockedNames,
	matchesNameSearchTerm,
} from "@/shared/lib/names/nameFilters";
import type { NameItem } from "@/shared/types";
import type { AdminStats, NameFilter, NameWithStats, SiteStatsLike } from "./types";

function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function mapNameToDisplay(name: NameItem): NameWithStats {
	return {
		...name,
		votes: Number((name.wins || 0) + (name.losses || 0)),
		lastVoted: undefined,
		popularityScore: Number(name.popularity_score ?? 0),
	};
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
		totalUsers: toNumber(siteStats?.totalUsers),
		recentVotes: toNumber(siteStats?.totalRatings),
	};
}

export function filterNamesByStatusAndSearch(
	names: NameWithStats[],
	filterStatus: NameFilter,
	searchTerm: string,
): NameWithStats[] {
	let filtered = names;

	if (filterStatus === "active") {
		filtered = getActiveNames(filtered);
	} else if (filterStatus === "hidden") {
		filtered = getHiddenNames(filtered);
	} else if (filterStatus === "locked") {
		filtered = getLockedNames(filtered);
	}

	const normalizedSearch = searchTerm.trim().toLowerCase();
	if (!normalizedSearch) {
		return filtered;
	}

	// ⚡ Bolt Optimization: Use a native for-loop instead of Array.prototype.filter to avoid callback overhead in hot path.
	const result: NameWithStats[] = [];
	const len = filtered.length;
	for (let i = 0; i < len; i++) {
		const name = filtered[i];
		if (matchesNameSearchTerm(name, normalizedSearch)) {
			result.push(name);
		}
	}

	return result;
}
