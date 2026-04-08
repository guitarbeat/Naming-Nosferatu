import useAppStore from "@/store/appStore";
import { isRpcSignatureError } from "@/shared/lib/errors";
import { withSupabase } from "@/shared/services/supabase/runtime";
import type { IdType } from "@/shared/types";

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

export async function softDeleteName(params: { nameId: IdType }): Promise<void> {
	assertAdmin();
	const { nameId } = params;
	const result = await withSupabase(async (client) => {
		// @ts-expect-error - soft_delete_cat_name is a custom RPC not in generated types
		const { data, error } = await client.rpc("soft_delete_cat_name", {
			p_name_id: String(nameId),
		});
		if (error) throw error;
		assertSuccess(data, "Failed to delete name");
		return true;
	}, false);

	if (result === false) {
		throw new Error("Supabase client not available");
	}
}

export async function batchUpdateVisibility(params: {
	nameIds: IdType[];
	isHidden: boolean;
}): Promise<void> {
	assertAdmin();
	const { nameIds, isHidden } = params;
	const result = await withSupabase(async (client) => {
		// @ts-expect-error - batch_update_name_visibility is a custom RPC not in generated types
		const { data, error } = await client.rpc("batch_update_name_visibility", {
			p_name_ids: nameIds.map(String),
			p_is_hidden: isHidden,
		});
		if (error) throw error;
		assertSuccess(data, "Failed to batch update name visibility");
		return true;
	}, false);

	if (result === false) {
		throw new Error("Supabase client not available");
	}
}

export async function toggleNameHidden(params: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName: string;
}): Promise<void> {
	assertAdmin();
	const { isCurrentlyHidden, nameId, userName } = params;
	const trimmedUserName = userName.trim();
	const result = await withSupabase(async (client) => {
		const { data, error } = await client.rpc("toggle_name_visibility", {
			p_name_id: String(nameId),
			p_hide: !isCurrentlyHidden,
			p_user_name: trimmedUserName || undefined,
		});
		if (error) throw error;
		assertSuccess(data, "Failed to update name visibility");
		return true;
	}, false);

	if (result === false) {
		throw new Error("Supabase client not available");
	}
}

export async function toggleNameLocked(params: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName: string;
}): Promise<void> {
	assertAdmin();
	const { isCurrentlyLocked, nameId, userName } = params;
	const trimmedUserName = userName.trim();
	const result = await withSupabase(async (client) => {
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
		return true;
	}, false);

	if (result === false) {
		throw new Error("Supabase client not available");
	}
}

export async function unhideAllNames(): Promise<void> {
	assertAdmin();
	const result = await withSupabase(async (client) => {
		// @ts-expect-error - unhide_all_names is a hypothetical RPC we might need
		// If not available, we use batchUpdateVisibility with all hidden IDs
		const { data: hiddenData, error: fetchError } = await client
			.from("cat_names")
			.select("id")
			.eq("is_hidden", true);

		if (fetchError) throw fetchError;
		const hiddenIds = (hiddenData ?? []).map((row) => row.id);

		if (hiddenIds.length === 0) return true;

		// @ts-expect-error - batch_update_name_visibility is a custom RPC
		const { data, error } = await client.rpc("batch_update_name_visibility", {
			p_name_ids: hiddenIds.map(String),
			p_is_hidden: false,
		});
		if (error) throw error;
		assertSuccess(data, "Failed to unhide all names");
		return true;
	}, false);

	if (result === false) {
		throw new Error("Supabase client not available");
	}
}
