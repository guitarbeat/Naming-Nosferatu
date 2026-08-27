import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { IdType } from "@/shared/api/types";
import type { NameItem } from "./types";

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
		queryFn: () => fetchNames(_includeHidden),
		staleTime: 30_000,
	});

export async function softDeleteName(_params: { nameId: IdType }): Promise<void> {}
export async function toggleNameHidden(_params: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName: string;
}): Promise<void> {}
export async function toggleNameLocked(_params: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName: string;
}): Promise<void> {}
export async function unhideAllNames(): Promise<void> {}
export async function batchUpdateVisibility(_params: {
	nameIds: IdType[];
	isHidden: boolean;
}): Promise<void> {}
export async function batchUpdateLocked(_params: {
	nameIds: IdType[];
	isLocked: boolean;
}): Promise<void> {}
export async function addName(_params: { name: string; description?: string }): Promise<NameItem> {
	throw new Error("Not implemented");
}

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
				toggleNameHidden({ nameId, isCurrentlyHidden, userName: trimmedUserName }),
			invalidateNames,
		),
	);

	const toggleLockedMutation = useMutation(
		createInvalidatingMutationOptions<ToggleLockedInput>(
			({ nameId, isCurrentlyLocked }) =>
				toggleNameLocked({ nameId, isCurrentlyLocked, userName: trimmedUserName }),
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
			({ nameIds, isHidden }) => batchUpdateVisibility({ nameIds, isHidden }),
			invalidateNames,
		),
	);

	const batchUpdateLockedMutation = useMutation(
		createInvalidatingMutationOptions<BatchUpdateLockedInput>(
			({ nameIds, isLocked }) => batchUpdateLocked({ nameIds, isLocked }),
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
