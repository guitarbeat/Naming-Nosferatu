import { QueryClient, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { IdType, NameItem } from "@/shared/types";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 1000 * 60 * 5,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

/* ==========================================================================
   Constants & Error Utilities
   ========================================================================== */
export const SUPABASE_UNAVAILABLE_MSG = "Database is unavailable. Running in local mode.";

/* ==========================================================================
   Names API Types & Queries
   ========================================================================== */
export type NamesDataSource = "local";

export interface NamesQueryResult {
	names: NameItem[];
	source: NamesDataSource;
}

export const DEFAULT_CANDIDATE_NAMES: NameItem[] = [
	{
		id: "1",
		name: "Nosferatu",
		description: "The immortal feline count with shadowy charm and ancient wisdom",
		avgRating: 1650,
		avg_rating: 1650,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 14,
		losses: 2,
		status: "candidate",
	},
	{
		id: "2",
		name: "Luna",
		description: "Graceful and mysterious moonlit tabby",
		avgRating: 1580,
		avg_rating: 1580,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 11,
		losses: 3,
		status: "candidate",
	},
	{
		id: "3",
		name: "Miso",
		description: "Sweet, warm, and playful companion who purrs like an engine",
		avgRating: 1540,
		avg_rating: 1540,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 9,
		losses: 4,
		status: "candidate",
	},
	{
		id: "4",
		name: "Pixel",
		description: "Tech-savvy, energetic, and clever little troublemaker",
		avgRating: 1510,
		avg_rating: 1510,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 8,
		losses: 5,
		status: "candidate",
	},
	{
		id: "5",
		name: "Saffron",
		description: "Warm and spicy personality with gorgeous golden fur",
		avgRating: 1480,
		avg_rating: 1480,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 7,
		losses: 6,
		status: "candidate",
	},
	{
		id: "6",
		name: "Noodle",
		description: "Long, stretchy, and endlessly goofy acrobatic champion",
		avgRating: 1460,
		avg_rating: 1460,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 6,
		losses: 7,
		status: "candidate",
	},
	{
		id: "7",
		name: "Ziggy",
		description: "Bold, fearless explorer who loves high perches",
		avgRating: 1440,
		avg_rating: 1440,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 5,
		losses: 8,
		status: "candidate",
	},
	{
		id: "8",
		name: "Whiskers",
		description: "Classic, distinguished, and timeless gentlegato",
		avgRating: 1420,
		avg_rating: 1420,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 4,
		losses: 9,
		status: "candidate",
	},
	{
		id: "9",
		name: "Pepper",
		description: "Small but mighty whirlwind of feline energy",
		avgRating: 1400,
		avg_rating: 1400,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 3,
		losses: 9,
		status: "candidate",
	},
	{
		id: "10",
		name: "Shadow",
		description: "Silent stalker of dust motes and midnight zoomies",
		avgRating: 1530,
		avg_rating: 1530,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 8,
		losses: 5,
		status: "candidate",
	},
	{
		id: "11",
		name: "Milo",
		description: "Friendly adventurer with an insatiable curious streak",
		avgRating: 1500,
		avg_rating: 1500,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 7,
		losses: 6,
		status: "candidate",
	},
	{
		id: "12",
		name: "Barnaby",
		description: "Dignified floof with a heart of pure gold",
		avgRating: 1390,
		avg_rating: 1390,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 2,
		losses: 10,
		status: "candidate",
	},
];

const CANDIDATE_STORAGE_KEY = "nosferatu-candidates";

function getStoredNames(): NameItem[] {
	if (typeof window === "undefined") {
		return DEFAULT_CANDIDATE_NAMES;
	}
	try {
		const raw = window.localStorage.getItem(CANDIDATE_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}
		}
	} catch {
		// fallback
	}
	return DEFAULT_CANDIDATE_NAMES;
}

function saveStoredNames(names: NameItem[]): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(names));
	} catch (e) {
		console.warn("Failed to persist candidates:", e);
	}
}

export const namesQueryKeys = {
	all: ["names"] as const,
	lists: () => [...namesQueryKeys.all, "list"] as const,
	list: (includeHidden: boolean) => [...namesQueryKeys.lists(), { includeHidden }] as const,
} as const;

export async function fetchNames(includeHidden: boolean): Promise<NamesQueryResult> {
	const all = getStoredNames();
	const names = includeHidden ? all : all.filter((n) => !n.isHidden && !n.is_hidden);
	return { names, source: "local" };
}

export const namesQueryOptions = (includeHidden: boolean) =>
	queryOptions({
		queryKey: namesQueryKeys.list(includeHidden),
		queryFn: () => fetchNames(includeHidden),
		staleTime: 30_000,
	});

export async function softDeleteName({ nameId }: { nameId: IdType }): Promise<void> {
	const all = getStoredNames();
	const updated = all.filter((item) => item.id !== nameId);
	saveStoredNames(updated);
}

export async function toggleNameHidden({
	nameId,
	isCurrentlyHidden,
}: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName?: string;
}): Promise<void> {
	const all = getStoredNames();
	const updated = all.map((item) => {
		if (item.id === nameId) {
			return {
				...item,
				isHidden: !isCurrentlyHidden,
				is_hidden: !isCurrentlyHidden,
				isActive: isCurrentlyHidden,
				is_active: isCurrentlyHidden,
			};
		}
		return item;
	});
	saveStoredNames(updated);
}

export async function toggleNameLocked({
	nameId,
	isCurrentlyLocked,
}: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName?: string;
}): Promise<void> {
	const all = getStoredNames();
	const updated = all.map((item) => {
		if (item.id === nameId) {
			return {
				...item,
				lockedIn: !isCurrentlyLocked,
				locked_in: !isCurrentlyLocked,
			};
		}
		return item;
	});
	saveStoredNames(updated);
}

export async function unhideAllNames(): Promise<void> {
	const all = getStoredNames();
	const updated = all.map((item) => ({
		...item,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
	}));
	saveStoredNames(updated);
}

export async function batchUpdateVisibility({
	nameIds,
	isHidden,
}: {
	nameIds: IdType[];
	isHidden: boolean;
	userName?: string;
}): Promise<void> {
	const all = getStoredNames();
	const idSet = new Set(nameIds);
	const updated = all.map((item) => {
		if (idSet.has(item.id)) {
			return {
				...item,
				isHidden,
				is_hidden: isHidden,
				isActive: !isHidden,
				is_active: !isHidden,
			};
		}
		return item;
	});
	saveStoredNames(updated);
}

export async function batchUpdateLocked({
	nameIds,
	isLocked,
}: {
	nameIds: IdType[];
	isLocked: boolean;
	userName?: string;
}): Promise<void> {
	const all = getStoredNames();
	const idSet = new Set(nameIds);
	const updated = all.map((item) => {
		if (idSet.has(item.id)) {
			return {
				...item,
				lockedIn: isLocked,
				locked_in: isLocked,
			};
		}
		return item;
	});
	saveStoredNames(updated);
}

export async function addName({
	name,
	description,
}: {
	name: string;
	description?: string;
}): Promise<NameItem> {
	const all = getStoredNames();
	const newItem: NameItem = {
		id: `custom-${Date.now()}`,
		name: name.trim(),
		description: description?.trim() || "Community suggested cat name",
		avgRating: 1500,
		avg_rating: 1500,
		isHidden: false,
		is_hidden: false,
		isActive: true,
		is_active: true,
		lockedIn: false,
		locked_in: false,
		wins: 0,
		losses: 0,
		status: "candidate",
		createdAt: new Date().toISOString(),
		created_at: new Date().toISOString(),
	};
	all.unshift(newItem);
	saveStoredNames(all);
	return newItem;
}

/* ==========================================================================
   Admin Actions Mutation Hook
   ========================================================================== */
export interface ToggleHiddenInput {
	nameId: IdType;
	isCurrentlyHidden: boolean;
}

export interface ToggleLockedInput {
	nameId: IdType;
	isCurrentlyLocked: boolean;
}

export interface DeleteNameInput {
	nameId: IdType;
}

export interface BatchUpdateVisibilityInput {
	nameIds: IdType[];
	isHidden: boolean;
}

export interface BatchUpdateLockedInput {
	nameIds: IdType[];
	isLocked: boolean;
}

function createInvalidatingMutationOptions<TVariables>(
	mutationFn: (variables: TVariables) => Promise<void>,
	invalidateNames: () => Promise<unknown>,
) {
	return {
		mutationFn,
		onSuccess: async () => {
			await invalidateNames();
		},
	};
}

export function useNameAdminActions(userName: string) {
	const queryClient = useQueryClient();
	const trimmedUserName = userName.trim();

	const invalidateNames = useCallback(() => {
		return queryClient.invalidateQueries({ queryKey: namesQueryKeys.all });
	}, [queryClient]);

	const toggleHiddenMutation = useMutation(
		createInvalidatingMutationOptions<ToggleHiddenInput>(
			({ nameId, isCurrentlyHidden }) =>
				toggleNameHidden({
					nameId,
					isCurrentlyHidden,
					userName: trimmedUserName,
				}),
			invalidateNames,
		),
	);

	const toggleLockedMutation = useMutation(
		createInvalidatingMutationOptions<ToggleLockedInput>(
			({ nameId, isCurrentlyLocked }) =>
				toggleNameLocked({
					nameId,
					isCurrentlyLocked,
					userName: trimmedUserName,
				}),
			invalidateNames,
		),
	);

	const deleteNameMutation = useMutation(
		createInvalidatingMutationOptions<DeleteNameInput>(
			({ nameId }) => softDeleteName({ nameId }),
			invalidateNames,
		),
	);

	const batchUpdateVisibilityMutation = useMutation(
		createInvalidatingMutationOptions<BatchUpdateVisibilityInput>(
			({ nameIds, isHidden }) =>
				batchUpdateVisibility({
					nameIds,
					isHidden,
					userName: trimmedUserName,
				}),
			invalidateNames,
		),
	);

	const batchUpdateLockedMutation = useMutation(
		createInvalidatingMutationOptions<BatchUpdateLockedInput>(
			({ nameIds, isLocked }) =>
				batchUpdateLocked({
					nameIds,
					isLocked,
					userName: trimmedUserName,
				}),
			invalidateNames,
		),
	);

	const uploadImage = useCallback((_file: File | Blob) => Promise.resolve(), []);

	return {
		invalidateNames,
		toggleHidden: toggleHiddenMutation.mutateAsync,
		toggleLocked: toggleLockedMutation.mutateAsync,
		deleteName: deleteNameMutation.mutateAsync,
		batchUpdateVisibility: batchUpdateVisibilityMutation.mutateAsync,
		batchUpdateLocked: batchUpdateLockedMutation.mutateAsync,
		uploadImage,
	};
}

/* ==========================================================================
   Ratings & Tournament API
   ========================================================================== */
export interface TournamentMatchRatingParams {
	matchId?: string;
	winnerId: string;
	loserId: string;
	newWinnerRating?: number;
	newLoserRating?: number;
	[key: string]: unknown;
}

export const ratingsAPI = {
	applyTournamentMatch: async (_params: TournamentMatchRatingParams) => Promise.resolve(),
	saveRatings: async (
		userId: string,
		ratings: Record<string, { rating: number; wins: number; losses: number }>,
	) => {
		if (typeof window === "undefined") {
			return;
		}
		try {
			window.localStorage.setItem(`nosferatu-ratings-${userId}`, JSON.stringify(ratings));
			const all = getStoredNames();
			const updated = all.map((item) => {
				const r = ratings[item.id] || ratings[item.name];
				if (r) {
					return {
						...item,
						avgRating: Math.round(r.rating),
						avg_rating: Math.round(r.rating),
						wins: (item.wins ?? 0) + (r.wins ?? 0),
						losses: (item.losses ?? 0) + (r.losses ?? 0),
					};
				}
				return item;
			});
			saveStoredNames(updated);
		} catch (e) {
			console.warn("Failed to persist ratings:", e);
		}
	},
};

/* ==========================================================================
   Leaderboard & Stats API
   ========================================================================== */
export interface LeaderboardItem {
	name: string;
	score: number;
}

export interface EngagementDataPoint {
	timestamp?: number | string;
	value: number;
	label?: string;
	[key: string]: unknown;
}

export interface EngagementMetrics {
	current: number;
	previous: number;
	trend: number;
	trendDirection: "up" | "down";
	dataPoints: EngagementDataPoint[];
	timeframe: string;
	metricType: string;
}

export interface SiteStats {
	totalUsers: number;
	totalNames: number;
	totalMatches: number;
}

export interface UserStats {
	wins: number;
	matches: number;
	rank: number;
}

export const leaderboardAPI = {
	getLeaderboard: async (limit: number): Promise<LeaderboardItem[]> => {
		const names = getStoredNames();
		return names
			.filter((n) => !n.isHidden && !n.is_hidden)
			.sort((a, b) => (b.avgRating ?? 1500) - (a.avgRating ?? 1500))
			.slice(0, limit)
			.map((n) => ({ name: n.name, score: Math.round(n.avgRating ?? 1500) }));
	},
};

export const statsAPI = {
	getEngagementMetrics: async (_timeframe: string): Promise<EngagementMetrics | null> => {
		return {
			current: 842,
			previous: 720,
			trend: 16.9,
			trendDirection: "up",
			dataPoints: [
				{ label: "Mon", value: 45 },
				{ label: "Tue", value: 68 },
				{ label: "Wed", value: 89 },
				{ label: "Thu", value: 112 },
				{ label: "Fri", value: 145 },
				{ label: "Sat", value: 198 },
				{ label: "Sun", value: 185 },
			],
			timeframe: "7d",
			metricType: "Votes Cast",
		};
	},
	getSiteStats: async (): Promise<SiteStats | null> => {
		const names = getStoredNames();
		return {
			totalUsers: 142,
			totalNames: names.length,
			totalMatches: 384,
		};
	},
	getUserStats: async (_userName: string): Promise<UserStats | null> => {
		return {
			wins: 18,
			matches: 24,
			rank: 1,
		};
	},
};
