import { isRpcSignatureError } from "@/shared/lib/errors";
import { withSupabase } from "@/shared/services/supabase/runtime";
import type { IdType } from "@/shared/types";

/** Throws when the RPC returns a non-true result. */
function assertSuccess(data: unknown, message: string): void {
	if (data !== true) {
		throw new Error(message);
	}
}

export async function softDeleteName(params: { nameId: IdType }): Promise<void> {
	const { nameId } = params;
	await withSupabase(async (client) => {
		// @ts-expect-error - soft_delete_cat_name is a custom RPC not in generated types
		const { data, error } = await client.rpc("soft_delete_cat_name", {
			p_name_id: String(nameId),
		});
		if (error) throw error;
		assertSuccess(data, "Failed to delete name");
	}, undefined as void);
}

export async function batchUpdateVisibility(params: {
	nameIds: IdType[];
	isHidden: boolean;
}): Promise<void> {
	const { nameIds, isHidden } = params;
	await withSupabase(async (client) => {
		// @ts-expect-error - batch_update_name_visibility is a custom RPC not in generated types
		const { data, error } = await client.rpc("batch_update_name_visibility", {
			p_name_ids: nameIds.map(String),
			p_is_hidden: isHidden,
		});
		if (error) throw error;
		assertSuccess(data, "Failed to batch update name visibility");
	}, undefined as void);
}

export async function toggleNameHidden(params: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName: string;
}): Promise<void> {
	const { isCurrentlyHidden, nameId, userName } = params;
	const trimmedUserName = userName.trim();
	await withSupabase(async (client) => {
		const { data, error } = await client.rpc("toggle_name_visibility", {
			p_name_id: String(nameId),
			p_hide: !isCurrentlyHidden,
			p_user_name: trimmedUserName || undefined,
		});
		if (error) throw error;
		assertSuccess(data, "Failed to update name visibility");
	}, undefined as void);
}

export async function toggleNameLocked(params: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName: string;
}): Promise<void> {
	const { isCurrentlyLocked, nameId, userName } = params;
	const trimmedUserName = userName.trim();
	await withSupabase(async (client) => {
		const canonicalArgs = {
			p_name_id: String(nameId),
			p_locked_in: !isCurrentlyLocked,
		};
		let result = await client.rpc("toggle_name_locked_in", canonicalArgs);

		if (result.error && isRpcSignatureError(result.error.message || "")) {
			result = await client.rpc("toggle_name_locked_in", {
				...canonicalArgs,
				p_user_name: trimmedUserName,
			});
		}

		if (result.error) {
			throw new Error(result.error.message || "Failed to toggle locked status");
		}
		assertSuccess(result.data, "Failed to toggle locked status");
	}, undefined as void);
}
