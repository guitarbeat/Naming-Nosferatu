/**
 * @module analyticsHooks
 * @description React hooks for analytics data fetching and display processing.
 *
 * Exports two hooks:
 *
 * - `useAnalysisData` — Parallel data-fetching with TanStack Query. Loads
 *   leaderboard, selection popularity, admin analytics, ranking history,
 *   and site stats as independent queries with appropriate stale times.
 *
 * - `useAnalysisDisplayData` — Pure transformation hook. Consolidates raw API
 *   data into display-ready structures: sorted/filtered name lists, summary
 *   stats, percentile-enriched insights, and general insight messages.
 *
 * ## Architecture
 *
 * The data-fetching and display-processing concerns are deliberately separated
 * so that:
 * 1. Components can use `useAnalysisDisplayData` with any data source (not just
 *    the TanStack queries), making testing and Storybook stories straightforward.
 * 2. The query keys and stale times are centralized in `useAnalysisData`.
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	type AnalyticsDataItem,
	analyticsAPI,
	type ConsolidatedName,
	type GeneralInsight,
	type HighlightItem,
	type LeaderboardItem,
	leaderboardAPI,
	type NameWithInsight,
	type SelectionPopularityItem,
	type SummaryStats,
	statsAPI,
} from "@/services/analytics/analyticsService";
import { calculatePercentile } from "@/utils/basic";

// ═══════════════════════════════════════════════════════════════════════════════
// Query Stale Times
// ═══════════════════════════════════════════════════════════════════════════════

const STALE = {
	SHORT: 1000 * 60 * 5, // 5 minutes
	MEDIUM: 1000 * 60 * 15, // 15 minutes
	LONG: 1000 * 60 * 60, // 1 hour
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// useAnalysisData — Parallel Data Fetching
// ═══════════════════════════════════════════════════════════════════════════════

interface UseAnalysisDataProps {
	userName?: string | null;
	isAdmin?: boolean;
	userFilter?: string;
	dateFilter?: string;
	rankingPeriods?: number;
	enabled?: boolean;
}

export function useAnalysisData({
	userName,
	isAdmin = false,
	userFilter = "all",
	dateFilter = "all",
	rankingPeriods = 7,
	enabled = true,
}: UseAnalysisDataProps) {
	const leaderboardQuery = useQuery({
		queryKey: ["leaderboard"],
		queryFn: () => leaderboardAPI.getLeaderboard(null),
		enabled,
		staleTime: STALE.SHORT,
	});

	const popularityQuery = useQuery({
		queryKey: ["selectionPopularity"],
		queryFn: () => analyticsAPI.getTopSelectedNames(null),
		enabled,
		staleTime: STALE.SHORT,
	});

	const analyticsQuery = useQuery({
		queryKey: ["popularityAnalytics", userFilter, userName],
		queryFn: () => analyticsAPI.getPopularityScores(null, userFilter, userName ?? null),
		enabled: enabled && isAdmin,
		staleTime: STALE.SHORT,
	});

	const rankingHistoryQuery = useQuery({
		queryKey: ["rankingHistory", rankingPeriods, dateFilter],
		queryFn: () => analyticsAPI.getRankingHistory(10, rankingPeriods, { dateFilter }),
		enabled,
		staleTime: STALE.MEDIUM,
	});

	const siteStatsQuery = useQuery({
		queryKey: ["siteStats"],
		queryFn: () => statsAPI.getSiteStats(),
		enabled: enabled && isAdmin,
		staleTime: STALE.LONG,
	});

	return {
		leaderboardData: leaderboardQuery.data ?? null,
		selectionPopularity: popularityQuery.data ?? null,
		analyticsData: analyticsQuery.data ?? null,
		rankingHistory: rankingHistoryQuery.data ?? null,
		siteStats: siteStatsQuery.data ?? null,

		isLoading:
			leaderboardQuery.isLoading ||
			popularityQuery.isLoading ||
			(isAdmin && analyticsQuery.isLoading) ||
			rankingHistoryQuery.isLoading ||
			(isAdmin && siteStatsQuery.isLoading),

		error:
			leaderboardQuery.error ??
			popularityQuery.error ??
			analyticsQuery.error ??
			rankingHistoryQuery.error ??
			siteStatsQuery.error ??
			null,

		refetch: () => {
			leaderboardQuery.refetch();
			popularityQuery.refetch();
			rankingHistoryQuery.refetch();
			if (isAdmin) {
				analyticsQuery.refetch();
				siteStatsQuery.refetch();
			}
		},
	};
}

// ═══════════════════════════════════════════════════════════════════════════════
// useAnalysisDisplayData — Pure Data Transformation
// ═══════════════════════════════════════════════════════════════════════════════

export interface UseAnalysisDisplayDataProps {
	leaderboardData: LeaderboardItem[] | null;
	selectionPopularity: SelectionPopularityItem[] | null;
	analyticsData: AnalyticsDataItem[] | null;
	isAdmin: boolean;
	highlights?: { topRated?: HighlightItem[]; mostWins?: HighlightItem[] };
	filterConfig?: {
		selectionFilter?: string;
		dateFilter?: string;
		[key: string]: unknown;
	};
	sortField: string;
	sortDirection: string;
}

export function useAnalysisDisplayData({
	leaderboardData,
	selectionPopularity,
	analyticsData,
	isAdmin,
	highlights,
	filterConfig,
	sortField,
	sortDirection,
}: UseAnalysisDisplayDataProps) {
	// ── 1. Consolidate raw data from multiple API sources ──────────────

	const consolidatedNames = useMemo((): ConsolidatedName[] => {
		// Admin view: use the full analytics data directly
		if (isAdmin && analyticsData?.length) {
			return analyticsData.map((item) => ({
				id: item.name_id,
				name: item.name,
				rating: item.avg_rating || 1500,
				wins: item.total_wins || 0,
				selected: item.times_selected || 0,
				dateSubmitted: item.created_at ?? item.date_submitted ?? null,
			}));
		}

		// User view: merge leaderboard + selection data
		const nameMap = new Map<string, ConsolidatedName>();

		if (leaderboardData?.length) {
			for (const item of leaderboardData) {
				if ((item.avg_rating ?? 0) > 1500 || (item.wins ?? 0) > 0) {
					nameMap.set(String(item.name_id), {
						id: item.name_id,
						name: item.name,
						rating: item.avg_rating || 1500,
						wins: item.wins ?? 0,
						selected: 0,
						dateSubmitted: item.created_at ?? item.date_submitted ?? null,
					});
				}
			}
		}

		if (selectionPopularity?.length) {
			for (const item of selectionPopularity) {
				const key = String(item.name_id);
				const existing = nameMap.get(key);
				if (existing) {
					existing.selected = item.times_selected || 0;
				} else {
					nameMap.set(key, {
						id: key,
						name: item.name,
						rating: 1500,
						wins: 0,
						selected: item.times_selected || 0,
						dateSubmitted: item.created_at ?? item.date_submitted ?? null,
					});
				}
			}
		}

		return Array.from(nameMap.values()).sort((a, b) => {
			if (b.rating !== a.rating) {
				return b.rating - a.rating;
			}
			return b.wins - a.wins;
		});
	}, [leaderboardData, selectionPopularity, analyticsData, isAdmin]);

	// ── 2. Filter, Sort, and Build Display List ───────────────────────

	const displayNames = useMemo((): ConsolidatedName[] => {
		let names: ConsolidatedName[];

		if (isAdmin && consolidatedNames.length > 0) {
			names = [...consolidatedNames];
		} else if (highlights?.topRated?.length) {
			// Use highlights when no consolidated data
			const highlightMap = new Map<string, ConsolidatedName>();
			for (const item of highlights.topRated) {
				highlightMap.set(item.id, {
					id: item.id,
					name: item.name,
					rating: item.avg_rating || item.value || 1500,
					wins: 0,
					selected: 0,
					dateSubmitted: null,
				});
			}
			if (highlights.mostWins?.length) {
				for (const item of highlights.mostWins) {
					const existing = highlightMap.get(item.id);
					if (existing) {
						existing.wins = item.value || 0;
					}
				}
			}
			names = Array.from(highlightMap.values());
		} else {
			names = [...consolidatedNames];
		}

		// Apply selection filter
		if (filterConfig?.selectionFilter && filterConfig.selectionFilter !== "all") {
			if (filterConfig.selectionFilter === "selected") {
				names = names.filter((n) => n.selected > 0);
			} else if (filterConfig.selectionFilter === "never_selected") {
				names = names.filter((n) => n.selected === 0);
			}
		}

		// Apply date filter
		if (filterConfig?.dateFilter && filterConfig.dateFilter !== "all") {
			const now = new Date();
			let filterDate: Date;

			switch (filterConfig.dateFilter) {
				case "today":
					filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
					break;
				case "week":
					filterDate = new Date(now);
					filterDate.setDate(now.getDate() - 7);
					break;
				case "month":
					filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
					break;
				case "year":
					filterDate = new Date(now.getFullYear(), 0, 1);
					break;
				default:
					filterDate = new Date(0);
			}

			names = names.filter((n) => {
				if (!n.dateSubmitted) {
					return false;
				}
				return new Date(n.dateSubmitted) >= filterDate;
			});
		}

		// Apply sorting
		if (sortField) {
			names.sort((a, b) => {
				let aVal = a[sortField as keyof ConsolidatedName];
				let bVal = b[sortField as keyof ConsolidatedName];

				// Date sorting: parse to timestamp
				if (sortField === "dateSubmitted") {
					aVal = aVal ? new Date(aVal as string).getTime() : 0;
					bVal = bVal ? new Date(bVal as string).getTime() : 0;
				}

				// String comparison
				if (typeof aVal === "string" && typeof bVal === "string") {
					return sortDirection === "desc" ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
				}

				// Numeric comparison
				const aNum = Number(aVal) || 0;
				const bNum = Number(bVal) || 0;
				return sortDirection === "desc" ? bNum - aNum : aNum - bNum;
			});
		}

		return names;
	}, [highlights, consolidatedNames, isAdmin, sortField, sortDirection, filterConfig]);

	// ── 3. Summary Stats ──────────────────────────────────────────────

	const summaryStats = useMemo((): SummaryStats | null => {
		if (displayNames.length === 0) {
			return null;
		}

		const ratings = displayNames.map((n) => n.rating);
		const wins = displayNames.map((n) => n.wins);
		const selections = displayNames.map((n) => n.selected);

		return {
			maxRating: Math.max(...ratings),
			maxWins: Math.max(...wins),
			maxSelected: Math.max(...selections),
			avgRating: Math.round(ratings.reduce((s, v) => s + v, 0) / ratings.length),
			avgWins: Math.round((wins.reduce((s, v) => s + v, 0) / wins.length) * 10) / 10,
			totalSelected: selections.reduce((s, v) => s + v, 0),
			topName: displayNames[0],
		};
	}, [displayNames]);

	// ── 4. Insights & Percentiles ─────────────────────────────────────

	const namesWithInsights = useMemo((): NameWithInsight[] => {
		if (displayNames.length === 0) {
			return [];
		}

		const allRatings = displayNames.map((n) => n.rating);
		const allSelections = displayNames.map((n) => n.selected);

		return displayNames.map((item) => {
			const ratingPercentile = calculatePercentile(item.rating, allRatings, true);
			const selectedPercentile = calculatePercentile(item.selected, allSelections, true);

			const insights: string[] = [];

			// Negative indicators
			if (ratingPercentile <= 10) {
				insights.push("worst_rated");
			}
			if (selectedPercentile <= 10 && item.selected === 0) {
				insights.push("never_selected");
			}
			if (item.selected === 0 && item.wins === 0 && item.rating <= 1500) {
				insights.push("inactive");
			}
			if (ratingPercentile <= 20 && selectedPercentile <= 20) {
				insights.push("poor_performer");
			}

			// Positive indicators
			if (ratingPercentile >= 90) {
				insights.push("top_rated");
			}
			if (selectedPercentile >= 90) {
				insights.push("most_selected");
			}
			if (ratingPercentile >= 70 && selectedPercentile < 50) {
				insights.push("underrated");
			}
			if (item.wins > 0 && !displayNames.some((n) => n.id !== item.id && n.wins > 0)) {
				insights.push("undefeated");
			}

			return {
				...item,
				ratingPercentile,
				selectedPercentile,
				insights,
			};
		});
	}, [displayNames]);

	// ── 5. General Insight Messages ───────────────────────────────────

	const generalInsights = useMemo((): GeneralInsight[] => {
		if (!summaryStats || displayNames.length === 0) {
			return [];
		}

		const result: GeneralInsight[] = [];

		// Lowest rated name
		const worstRated = [...displayNames].sort((a, b) => a.rating - b.rating)[0];
		if (worstRated && worstRated.rating < 1500) {
			result.push({
				type: "warning",
				message: `${worstRated.name} has the lowest rating (${worstRated.rating}) — consider hiding`,
				icon: "⚠️",
			});
		}

		// Never-selected count
		const neverSelectedCount = displayNames.filter((n) => n.selected === 0).length;
		if (neverSelectedCount > 0) {
			result.push({
				type: "warning",
				message: `${neverSelectedCount} name${neverSelectedCount === 1 ? "" : "s"} never selected — consider hiding inactive ones`,
				icon: "🗑️",
			});
		}

		// Leader
		if (summaryStats.topName) {
			result.push({
				type: "info",
				message: `${summaryStats.topName.name} leads with a rating of ${summaryStats.topName.rating}`,
				icon: "🏆",
			});
		}

		return result;
	}, [summaryStats, displayNames]);

	return {
		displayNames,
		summaryStats,
		namesWithInsights,
		generalInsights,
	};
}
