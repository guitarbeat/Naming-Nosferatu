import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { IdType, NameItem } from "@/shared/types";

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

export const namesQueryKeys = {
	all: ["names"] as const,
	lists: () => [...namesQueryKeys.all, "list"] as const,
	list: (includeHidden: boolean) => [...namesQueryKeys.lists(), { includeHidden }] as const,
} as const;

export async function fetchNames(_includeHidden: boolean): Promise<NamesQueryResult> {
	return { names: [], source: "local" };
}

export const namesQueryOptions = (includeHidden: boolean) =>
	queryOptions({
		queryKey: namesQueryKeys.list(includeHidden),
		queryFn: () => fetchNames(includeHidden),
		staleTime: 30_000,
	});

export async function softDeleteName(_params: { nameId: IdType }): Promise<void> {
	// no-op
}

export async function toggleNameHidden(_params: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName?: string;
}): Promise<void> {
	// no-op
}

export async function toggleNameLocked(_params: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName?: string;
}): Promise<void> {
	// no-op
}

export async function unhideAllNames(): Promise<void> {
	// no-op
}

export async function batchUpdateVisibility(_params: {
	nameIds: IdType[];
	isHidden: boolean;
	userName?: string;
}): Promise<void> {
	// no-op
}

export async function batchUpdateLocked(_params: {
	nameIds: IdType[];
	isLocked: boolean;
	userName?: string;
}): Promise<void> {
	// no-op
}

export async function addName(_params: { name: string; description?: string }): Promise<NameItem> {
	throw new Error("Not implemented");
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
		_userId: string,
		_ratings: Record<string, { rating: number; wins: number; losses: number }>,
	) => Promise.resolve(),
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
	getLeaderboard: async (_limit: number): Promise<LeaderboardItem[]> => [],
};

export const statsAPI = {
	getEngagementMetrics: async (_timeframe: string): Promise<EngagementMetrics | null> => null,
	getSiteStats: async (): Promise<SiteStats | null> => null,
	getUserStats: async (_userName: string): Promise<UserStats | null> => null,
};
