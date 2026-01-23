/**
 * @module useProfile
 * @description Consolidated hook for managing profile state, user context, and operations.
 */

import { resolveSupabaseClient } from "@supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FILTER_OPTIONS } from "@/constants";
import { statsAPI } from "@/features/analytics/analyticsService";
import { adminAPI } from "@/features/auth/adminService";
import { useAdminStatus } from "@/features/auth/authHooks";
import { deleteName, hiddenNamesAPI } from "@/services/supabase/modules/general";
import type { IdType, NameItem } from "@/types/components";
import { clearAllCaches, devError, devLog } from "@/utils";

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 * These fields come directly from database queries and cannot be changed without breaking queries.
 */
interface UserStats {
	avg_rating?: number;
	hidden_count?: number;
	total_losses?: number;
	total_ratings?: number;
	total_wins?: number;
	win_rate?: number;
	names_rated?: number;
	active_ratings?: number;
	hidden_ratings?: number;
	avg_rating_given?: number;
	total_tournaments?: number;
	total_selections?: number;
	unique_users?: number;
	is_aggregate?: boolean;
}

export interface SelectionStats {
	totalSelections: number;
	totalTournaments: number;
	avgSelectionsPerName: number;
	mostSelectedName: string;
	currentStreak: number;
	maxStreak: number;
	userRank: string;
	uniqueUsers: number;
	isAggregate: boolean;
	insights: {
		selectionPattern: string;
		preferredCategories: string;
		improvementTip: string;
	};
	nameSelectionCounts: Record<string, number>;
	nameLastSelected: Record<string, string>;
	nameSelectionFrequency: Record<string, number>;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
interface TournamentSelection {
	id?: number;
	name_id: string | number;
	name?: string;
	tournament_id: string;
	selected_at: string;
	user_name: string;
	selection_type?: string;
	created_at?: string;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
interface UserWithRoles {
	user_name: string;
	user_roles?:
		| {
				role: string;
		  }[]
		| null;
	created_at?: string | null;
	updated_at?: string | null;
}

// ============================================================================
// Service Logic
// ============================================================================

/**
 * * Fetch user statistics from database or calculate aggregate stats
 */
async function fetchUserStats(userName: string | null): Promise<UserStats | null> {
	if (userName === null) {
		try {
			const supabaseClient = await resolveSupabaseClient();
			if (!supabaseClient) {
				return null;
			}

			const { data: ratings, error: ratingsError } = await supabaseClient
				.from("cat_name_ratings")
				.select("rating, wins, losses, user_name");

			if (ratingsError) {
				devError("Error fetching aggregate ratings:", ratingsError);
				return null;
			}

			const { data: selections, error: selectionsError } = await supabaseClient
				.from("cat_tournament_selections" as any)
				.select("user_name, tournament_id");

			const typedSelections = selections as unknown as {
				user_name: string;
				tournament_id: string;
			}[];

			if (selectionsError) {
				devError("Error fetching aggregate selections:", selectionsError);
				return null;
			}

			const totalRatings = ratings?.length || 0;
			const totalWins = ratings?.reduce((sum, r) => sum + (r.wins || 0), 0) || 0;
			const totalLosses = ratings?.reduce((sum, r) => sum + (r.losses || 0), 0) || 0;
			const avgRating =
				totalRatings > 0
					? Math.round(ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) / totalRatings)
					: 1500;
			const uniqueUsers = new Set([
				...(ratings?.map((r) => r.user_name) || []),
				...(typedSelections?.map((s) => s.user_name) || []),
			]).size;
			const totalTournaments = new Set(typedSelections?.map((s) => s.tournament_id) || []).size;

			return {
				names_rated: totalRatings,
				active_ratings: totalRatings,
				hidden_ratings: 0,
				avg_rating_given: avgRating,
				total_wins: totalWins,
				total_losses: totalLosses,
				total_tournaments: totalTournaments,
				total_selections: selections?.length || 0,
				unique_users: uniqueUsers,
				is_aggregate: true,
			};
		} catch (error) {
			devError("Error calculating aggregate stats:", error);
			return null;
		}
	}

	if (!userName) {
		return null;
	}
	try {
		const dbStats = await statsAPI.getUserStats(userName);
		return (dbStats as UserStats) || null;
	} catch (error) {
		devError("Error fetching user stats from DB:", error);
		return null;
	}
}

/**
 * * Calculate selection analytics using tournament_selections table
 */
async function calculateSelectionStats(userName: string | null): Promise<SelectionStats | null> {
	try {
		const supabaseClient = await resolveSupabaseClient();
		if (!supabaseClient) {
			return null;
		}

		let query = supabaseClient
			.from("cat_tournament_selections" as any)
			.select("name_id, name, tournament_id, selected_at, user_name");
		if (userName !== null) {
			query = query.eq("user_name", userName);
		}

		const { data: selections, error } = await query.order("selected_at", {
			ascending: false,
		});
		if (error || !selections || selections.length === 0) {
			return null;
		}

		const typedSelections = selections as unknown as TournamentSelection[];

		const totalSelections = typedSelections.length;
		const uniqueTournaments = new Set(typedSelections.map((s) => s.tournament_id)).size;
		const uniqueNames = new Set(typedSelections.map((s) => s.name_id)).size;
		const uniqueUsers =
			userName === null ? new Set(typedSelections.map((s) => s.user_name)).size : 1;

		const nameCounts: Record<string, number> = {};
		const nameSelectionCounts: Record<string, number> = {};
		const nameLastSelected: Record<string, string> = {};
		const nameSelectionFrequency: Record<string, number> = {};

		typedSelections.forEach((s) => {
			if (s.name) {
				nameCounts[s.name] = (nameCounts[s.name] || 0) + 1;
			}
			if (s.name_id) {
				const nameId = String(s.name_id);
				nameSelectionCounts[nameId] = (nameSelectionCounts[nameId] || 0) + 1;
				const selectedDate = s.selected_at ? new Date(s.selected_at) : null;
				if (
					selectedDate &&
					s.selected_at &&
					(!nameLastSelected[nameId] || selectedDate > new Date(nameLastSelected[nameId]))
				) {
					nameLastSelected[nameId] = s.selected_at;
				}
			}
		});

		Object.keys(nameSelectionCounts).forEach((nameId) => {
			nameSelectionFrequency[nameId] =
				uniqueTournaments > 0
					? Math.round(((nameSelectionCounts[nameId] || 0) / uniqueTournaments) * 100) / 100
					: 0;
		});

		const mostSelectedName =
			Object.entries(nameCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
		const sortedDates = typedSelections
			.map((s) => new Date(s.selected_at || Date.now()).toDateString())
			.sort()
			.filter((d, i, a) => i === 0 || d !== a[i - 1]);

		let currentStreak = 0;
		let maxStreak = 0;
		let tempStreak = 0;
		for (let i = 0; i < sortedDates.length; i++) {
			if (i === 0) {
				tempStreak = 1;
			} else {
				const currentDate = sortedDates[i];
				const prevDate = sortedDates[i - 1];
				const dayDiff = Math.floor(
					(new Date(currentDate as string).getTime() - new Date(prevDate as string).getTime()) /
						(1000 * 60 * 60 * 24),
				);
				if (dayDiff === 1) {
					tempStreak++;
				} else {
					maxStreak = Math.max(maxStreak, tempStreak);
					tempStreak = 1;
				}
			}
		}
		maxStreak = Math.max(maxStreak, tempStreak);
		currentStreak = tempStreak;

		const generateSelectionPattern = (total: number, unique: number) => {
			const avg = Math.round((total / unique) * 10) / 10;
			if (avg > 8) {
				return "You prefer large tournaments with many names";
			}
			if (avg > 4) {
				return "You enjoy medium-sized tournaments";
			}
			return "You prefer focused, smaller tournaments";
		};

		const generatePreferredCategories = async (sels: TournamentSelection[]) => {
			try {
				const nameIds = sels.map((s) => String(s.name_id)).filter(Boolean);
				const sb = await resolveSupabaseClient();
				if (!sb || nameIds.length === 0) {
					return "Analyzing your preferences...";
				}
				const { data: nms, error: e } = await sb
					.from("cat_name_options")
					.select("categories")
					.in("id", nameIds);
				if (e || !nms) {
					return "Analyzing your preferences...";
				}
				const cats: Record<string, number> = {};
				nms.forEach((n) => {
					if (n.categories && Array.isArray(n.categories)) {
						n.categories.forEach((cat: string) => {
							cats[cat] = (cats[cat] || 0) + 1;
						});
					}
				});
				const top = Object.entries(cats)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 3)
					.map(([c]) => c);
				return top.length > 0 ? `You favor: ${top.join(", ")}` : "Discovering your preferences...";
			} catch {
				return "Analyzing your preferences...";
			}
		};

		const generateImprovementTip = (total: number, unique: number, str: number) => {
			if (total === 0) {
				return "Start selecting names to see your first tournament!";
			}
			if (unique < 3) {
				return "Try creating more tournaments to discover your preferences";
			}
			if (str < 3) {
				return "Build a selection streak by playing daily";
			}
			return "Great job! You're an active tournament participant";
		};

		return {
			totalSelections,
			totalTournaments: uniqueTournaments,
			avgSelectionsPerName:
				uniqueNames > 0 ? Math.round((totalSelections / uniqueNames) * 10) / 10 : 0,
			mostSelectedName,
			currentStreak: userName === null ? 0 : currentStreak,
			maxStreak: userName === null ? 0 : maxStreak,
			userRank: "N/A",
			uniqueUsers: userName === null ? uniqueUsers : 1,
			isAggregate: userName === null,
			insights: {
				selectionPattern:
					userName === null
						? "Aggregate data from all users"
						: generateSelectionPattern(totalSelections, uniqueTournaments),
				preferredCategories: await generatePreferredCategories(typedSelections),
				improvementTip:
					userName === null
						? `Total activity across ${uniqueUsers} users`
						: generateImprovementTip(totalSelections, uniqueTournaments, currentStreak),
			},
			nameSelectionCounts,
			nameLastSelected,
			nameSelectionFrequency,
		};
	} catch (error) {
		devError("Error calculating selection stats:", error);
		return null;
	}
}

/**
 * * List all users (admin only)
 */
async function listAllUsers(): Promise<UserWithRoles[]> {
	try {
		const { users } = await adminAPI.listUsers();
		return (users || []) as UserWithRoles[];
	} catch (error) {
		devError("Error listing users:", error);
		return [];
	}
}

/**
 * * Comprehensive hook for all profile functionality
 */
// ts-prune-ignore-next (used in TournamentSetup)
export function useProfile(
	userName: string,
	{
		showSuccess = (m: string) => devLog("Success:", m),
		showError = (m: string) => devError("Error:", m),
		fetchNames = (u: string) => devLog("Fetching names for:", u),
		setAllNames = (_val: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
			// Intentional no-op: optional callback for testing
		},
	} = {},
) {
	// ==========================================================================
	// User State (from useProfileUser)
	// ==========================================================================
	const { isAdmin } = useAdminStatus(userName);
	const [activeUser, setActiveUser] = useState<string | null>(userName);
	const [userFilter, setUserFilter] = useState(FILTER_OPTIONS.USER.CURRENT);
	const [availableUsers, setAvailableUsers] = useState<UserWithRoles[]>([]);
	const [_userListLoading, setUserListLoading] = useState(false);

	const canManageActiveUser = useMemo(
		() => isAdmin && activeUser === userName,
		[isAdmin, activeUser, userName],
	);

	// ==========================================================================
	// Stats State (from useProfileStats)
	// ==========================================================================
	const [stats, setStats] = useState<UserStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [selectionStats, setSelectionStats] = useState<SelectionStats | null>(null);
	const isMountedRef = useRef(true);

	// ==========================================================================
	// Operations State (from useProfileNameOperations)
	// ==========================================================================
	const [selectedNames, setSelectedNames] = useState<Set<IdType>>(new Set());
	const [hiddenNames, setHiddenNames] = useState<Set<IdType>>(new Set());

	// ==========================================================================
	// Effects & Loading Logic
	// ==========================================================================

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Sync activeUser with filter
	useEffect(() => {
		if (!userName) {
			return;
		}
		if (!isAdmin) {
			if (activeUser !== userName) {
				setActiveUser(userName);
			}
			return;
		}
		if (userFilter === FILTER_OPTIONS.USER.ALL) {
			if (activeUser !== null) {
				setActiveUser(null);
			}
		} else if (!userFilter || userFilter === FILTER_OPTIONS.USER.CURRENT) {
			if (activeUser !== userName) {
				setActiveUser(userName);
			}
		} else if (activeUser !== userFilter) {
			setActiveUser(userFilter);
		}
	}, [isAdmin, userFilter, activeUser, userName]);

	const refreshStats = useCallback(async () => {
		setStatsLoading(true);
		try {
			const [userStats, selStats] = await Promise.all([
				fetchUserStats(activeUser),
				calculateSelectionStats(activeUser),
			]);
			if (!isMountedRef.current) {
				return;
			}
			setStats(userStats);
			setSelectionStats(selStats);
		} catch (error) {
			devError("Failed to load profile data:", error);
		} finally {
			if (isMountedRef.current) {
				setStatsLoading(false);
			}
		}
	}, [activeUser]);

	// Load stats when activeUser changes
	useEffect(() => {
		void refreshStats();
	}, [refreshStats]);

	// Load users for admin
	useEffect(() => {
		if (!isAdmin) {
			return;
		}
		const loadUsers = async () => {
			setUserListLoading(true);
			try {
				const users = await listAllUsers();
				if (!isMountedRef.current) {
					return;
				}
				setAvailableUsers(users);
			} finally {
				if (isMountedRef.current) {
					setUserListLoading(false);
				}
			}
		};
		void loadUsers();
	}, [isAdmin]);

	// ==========================================================================
	// Handlers (from useProfileNameOperations)
	// ==========================================================================

	const handleToggleVisibility = useCallback(
		async (nameId: string) => {
			if (!canManageActiveUser) {
				return showError("Only admins can change name visibility");
			}
			try {
				const currentlyHidden = hiddenNames.has(nameId);
				const { success, error } = currentlyHidden
					? await hiddenNamesAPI.unhideName(userName, nameId)
					: await hiddenNamesAPI.hideName(userName, nameId);
				if (!success) {
					throw new Error(error);
				}

				showSuccess(currentlyHidden ? `"Name" is now visible` : `"Name" is now hidden`);
				setHiddenNames((prev) => {
					const next = new Set(prev);
					if (currentlyHidden) {
						next.delete(nameId);
					} else {
						next.add(nameId);
					}
					return next;
				});
				setAllNames((prev: NameItem[]) =>
					prev.map((n) => (n.id === nameId ? { ...n, isHidden: !currentlyHidden } : n)),
				);
				clearAllCaches();
			} catch (e: unknown) {
				const error = e instanceof Error ? e : new Error(String(e));
				showError(`Unable to update visibility: ${error.message}`);
			}
		},
		[canManageActiveUser, hiddenNames, userName, showSuccess, showError, setAllNames],
	);

	const handleDelete = useCallback(
		async (name: NameItem) => {
			if (!canManageActiveUser) {
				return showError("Only admins can delete names");
			}
			try {
				const { success, error } = await deleteName(String(name.id));
				if (!success) {
					throw new Error(error);
				}
				showSuccess(`"${name.name}" has been deleted`);
				fetchNames(userName);
			} catch (e: unknown) {
				const error = e instanceof Error ? e : new Error(String(e));
				showError(`Unable to delete name: ${error.message}`);
			}
		},
		[canManageActiveUser, userName, showSuccess, showError, fetchNames],
	);

	const handleSelectionChange = useCallback((id: IdType, selected: boolean) => {
		setSelectedNames((prev) => {
			const next = new Set(prev);
			if (selected) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}, []);

	const handleBulkOperation = useCallback(
		async (isHide: boolean, idsOverride?: string[]) => {
			if (!canManageActiveUser) {
				return showError("Only admins can perform bulk operations on names");
			}
			const ids = idsOverride || (Array.from(selectedNames) as string[]);
			if (ids.length === 0) {
				return;
			}

			try {
				const result = isHide
					? await hiddenNamesAPI.hideNames(userName, ids)
					: await hiddenNamesAPI.unhideNames(userName, ids);
				showSuccess(
					`Successfully ${isHide ? "hidden" : "unhidden"} ${result.length} ${result.length === 1 ? "name" : "names"}`,
				);
				setHiddenNames((prev) => {
					const next = new Set(prev);
					ids.forEach((id) => {
						if (isHide) {
							next.add(id);
						} else {
							next.delete(id);
						}
					});
					return next;
				});
				setSelectedNames(new Set());
				clearAllCaches();
				fetchNames(userName);
			} catch (e: unknown) {
				const error = e instanceof Error ? e : new Error(String(e));
				showError(`Unable to complete bulk operation: ${error.message}`);
			}
		},
		[canManageActiveUser, selectedNames, userName, showSuccess, showError, fetchNames],
	);

	// ==========================================================================
	// Memoized Options
	// ==========================================================================

	const userOptions = useMemo(() => {
		const base = [
			{
				value: FILTER_OPTIONS.USER.ALL,
				label: isAdmin ? "All Users (Aggregate)" : "All Users",
			},
			{
				value: FILTER_OPTIONS.USER.CURRENT,
				label: isAdmin ? "Your Data" : "Current User",
			},
		];
		if (!isAdmin) {
			return base;
		}

		const unique = new Map();
		availableUsers.forEach((u) => {
			const role = u.user_roles?.[0]?.role;
			const badges: string[] = [];
			if (role && role !== "user") {
				badges.push(role);
			}
			if (u.user_name === userName) {
				badges.push("you");
			}
			const label = `${u.user_name}${badges.length ? ` (${badges.join(", ")})` : ""}`;
			unique.set(u.user_name, { value: u.user_name, label });
		});

		return [...base, ...Array.from(unique.values()).sort((a, b) => a.value.localeCompare(b.value))];
	}, [isAdmin, availableUsers, userName]);

	return {
		isAdmin,
		activeUser,
		userFilter,
		setUserFilter,
		canManageActiveUser,
		userOptions,
		stats,
		statsLoading,
		selectionStats,
		selectedNames,
		setSelectedNames,
		hiddenNames,
		setHiddenNames,
		handleToggleVisibility,
		handleDelete,
		handleSelectionChange,
		handleBulkHide: (ids?: string[]) => handleBulkOperation(true, ids),
		handleBulkUnhide: (ids?: string[]) => handleBulkOperation(false, ids),
		fetchSelectionStats: refreshStats,
	};
}
