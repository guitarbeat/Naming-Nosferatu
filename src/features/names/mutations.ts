import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isRpcSignatureError } from "@/shared/lib/errors";
import { withSupabase } from "@/shared/services/supabase/runtime";
import type { IdType } from "@/shared/types";
import useAppStore from "@/store/appStore";

/** Throws when the RPC returns a non-true result. */
function assertSuccess(data: unknown, message: string): void {
	if (data !== true) {
		throw new Error(message);
	}
}

/** Verifies that the current user has admin privileges. */
function assertAdmin(): void {
	const user = useAppStore.getState().user;
	if (!user?.isAdmin) {
		throw new Error("Admin privileges required");
	}
}

const SUPABASE_UNAVAILABLE = Symbol("SUPABASE_UNAVAILABLE");

async function runAdminMutation<T>(
	operation: (client: SupabaseClient<Database>) => Promise<T>,
): Promise<T> {
	assertAdmin();

	const result = await withSupabase<T | typeof SUPABASE_UNAVAILABLE>(
		operation,
		SUPABASE_UNAVAILABLE,
	);

	if (result === SUPABASE_UNAVAILABLE) {
		throw new Error("Supabase client not available");
	}

	return result;
}

async function runBooleanAdminRpc(
	rpcName: string,
	args: Record<string, unknown>,
	errorMessage: string,
): Promise<void> {
	await runAdminMutation(async (client) => {
		// @ts-expect-error - custom RPCs are not in generated types
		const { data, error } = await client.rpc(rpcName, args);
		if (error) {
			throw error;
		}
		assertSuccess(data, errorMessage);
	});
}

export async function softDeleteName(params: { nameId: IdType }): Promise<void> {
	const { nameId } = params;
	await runBooleanAdminRpc(
		"soft_delete_cat_name",
		{ p_name_id: String(nameId) },
		"Failed to delete name",
	);
}

export async function batchUpdateVisibility(params: {
	nameIds: IdType[];
	isHidden: boolean;
}): Promise<void> {
	const { nameIds, isHidden } = params;
	await runBooleanAdminRpc(
		"batch_update_name_visibility",
		{
			p_name_ids: nameIds.map(String),
			p_is_hidden: isHidden,
		},
		"Failed to batch update name visibility",
	);
}

export async function batchUpdateLocked(params: {
	nameIds: IdType[];
	isLocked: boolean;
}): Promise<void> {
	const { nameIds, isLocked } = params;
	await runBooleanAdminRpc(
		"batch_update_name_locked",
		{
			p_name_ids: nameIds.map(String),
			p_is_locked: isLocked,
		},
		"Failed to batch update name locked status",
	);
}

export async function toggleNameHidden(params: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName: string;
}): Promise<void> {
	const { isCurrentlyHidden, nameId, userName } = params;
	const trimmedUserName = userName.trim();
	await runAdminMutation(async (client) => {
		// @ts-expect-error - toggle_name_visibility is a custom RPC not in generated types
		const { data, error } = await client.rpc("toggle_name_visibility", {
			p_name_id: String(nameId),
			p_hide: !isCurrentlyHidden,
			p_user_name: trimmedUserName || undefined,
		});
		if (error) {
			throw error;
		}
		assertSuccess(data, "Failed to update name visibility");
	});
}

export async function toggleNameLocked(params: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName: string;
}): Promise<void> {
	const { isCurrentlyLocked, nameId, userName } = params;
	const trimmedUserName = userName.trim();
	await runAdminMutation(async (client) => {
		const canonicalArgs = {
			p_name_id: String(nameId),
			p_locked_in: !isCurrentlyLocked,
		};
		let rpcResult = await client.rpc("toggle_name_locked_in", canonicalArgs);

		if (rpcResult.error && isRpcSignatureError(rpcResult.error.message || "")) {
			rpcResult = await client.rpc("toggle_name_locked_in", {
				...canonicalArgs,
				p_user_name: trimmedUserName,
			});
		}

		if (rpcResult.error) {
			throw new Error(rpcResult.error.message || "Failed to toggle locked status");
		}
		assertSuccess(rpcResult.data, "Failed to toggle locked status");
	});
}

export async function unhideAllNames(): Promise<void> {
	await runAdminMutation(async (client) => {
		// @ts-expect-error - unhide_all_names is a hypothetical RPC we might need
		// If not available, we use batchUpdateVisibility with all hidden IDs
		const { data: hiddenData, error: fetchError } = await client
			.from("cat_names")
			.select("id")
			.eq("is_hidden", true);

		if (fetchError) {
			throw fetchError;
		}
		const hiddenIds = (hiddenData ?? []).map((row) => row.id);

		if (hiddenIds.length === 0) {
			return true;
		}

		// @ts-expect-error - batch_update_name_visibility is a custom RPC
		const { data, error } = await client.rpc("batch_update_name_visibility", {
			p_name_ids: hiddenIds.map(String),
			p_is_hidden: false,
		});
		if (error) {
			throw error;
		}
		assertSuccess(data, "Failed to unhide all names");
	});
}
