import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
	batchUpdateLocked,
	batchUpdateVisibility,
	softDeleteName,
	toggleNameHidden,
	toggleNameLocked,
} from "@/features/names/mutations";
import { namesQueryKeys } from "@/features/names/queries";
import { imagesAPI } from "@/shared/services/supabase/api";
import type { IdType } from "@/shared/types";

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

export interface BatchVisibilityInput {
	nameIds: IdType[];
	isHidden: boolean;
}

export interface BatchLockedInput {
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

	const batchVisibilityMutation = useMutation(
		createInvalidatingMutationOptions<BatchVisibilityInput>(
			({ nameIds, isHidden }) => batchUpdateVisibility({ nameIds, isHidden }),
			invalidateNames,
		),
	);

	const batchLockedMutation = useMutation(
		createInvalidatingMutationOptions<BatchLockedInput>(
			({ nameIds, isLocked }) => batchUpdateLocked({ nameIds, isLocked }),
			invalidateNames,
		),
	);

	const uploadImage = useCallback(
		(file: File | Blob) => imagesAPI.upload(file, trimmedUserName),
		[trimmedUserName],
	);

	return {
		invalidateNames,
		toggleHidden: toggleHiddenMutation.mutateAsync,
		toggleLocked: toggleLockedMutation.mutateAsync,
		deleteName: deleteNameMutation.mutateAsync,
		batchUpdateVisibility: batchVisibilityMutation.mutateAsync,
		batchUpdateLocked: batchLockedMutation.mutateAsync,
		uploadImage,
	};
}
