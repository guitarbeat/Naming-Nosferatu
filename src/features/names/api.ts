import { queryOptions } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isRpcSignatureError } from "@/shared/lib/errors";
import { mapNameRow } from "@/shared/lib/names/mapNameRow";
import { resolveSupabaseClient, withSupabase } from "@/shared/services/supabase/runtime";
import type { IdType, NameItem } from "@/shared/types";
import useAppStore from "@/store/appStore";

// ============================================================================
// Types & Constants
// ============================================================================

export type NamesDataSource = "supabase";

export interface NamesQueryResult {
	names: NameItem[];
	source: NamesDataSource;
}

export const namesQueryKeys = {
	all: ["names"] as const,
	lists: () => [...namesQueryKeys.all, "list"] as const,
	list: (includeHidden: boolean) => [...namesQueryKeys.lists(), { includeHidden }] as const,
	hiddenList: () => [...namesQueryKeys.all, "hidden"] as const,
} as const;

const SUPABASE_UNAVAILABLE = Symbol("SUPABASE_UNAVAILABLE");

// ============================================================================
// Helpers
// ============================================================================

/** Verifies that the current user has admin privileges. */
function assertAdmin(message = "Admin privileges required"): void {
	const user = useAppStore.getState().user;
	if (!user?.isAdmin) {
		throw new Error(message);
	}
}

/** Throws when the RPC returns a non-true result. */
function assertSuccess(data: unknown, message: string): void {
	if (data !== true) {
		throw new Error(message);
	}
}

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

// ============================================================================
// Queries
// ============================================================================

async function fetchNamesFromSupabase(includeHidden: boolean): Promise<NameItem[] | null> {
	if (includeHidden) {
		assertAdmin("Admin privileges required to view hidden names");
	}
	const client = await resolveSupabaseClient();
	if (!client) {
		return null;
	}

	let query = client
		.from("cat_names")
		.select(
			"id, name, description, pronunciation, avg_rating, global_wins, global_losses, created_at, is_hidden, is_active, locked_in, status, provenance, is_deleted",
		)
		.eq("is_active", true)
		.eq("is_deleted", false);

	if (!includeHidden) {
		query = query.eq("is_hidden", false);
	}

	const { data, error } = await query.order("avg_rating", { ascending: false });
	if (error) {
		throw error;
	}

	return (data ?? []).map((row) => mapNameRow(row));
}

export async function fetchHiddenNames(): Promise<NamesQueryResult> {
	assertAdmin("Admin privileges required to view hidden names");
	const client = await resolveSupabaseClient();
	if (!client) {
		throw new Error("Supabase client not available");
	}

	const { data, error } = await client
		.from("cat_names")
		.select(
			"id, name, description, pronunciation, avg_rating, global_wins, global_losses, created_at, is_hidden, is_active, locked_in, status, provenance, is_deleted",
		)
		.eq("is_hidden", true)
		.eq("is_active", true)
		.eq("is_deleted", false)
		.order("avg_rating", { ascending: false });

	if (error) {
		throw error;
	}

	return {
		names: (data ?? []).map((row) => mapNameRow(row)),
		source: "supabase",
	};
}

export async function fetchNames(includeHidden: boolean): Promise<NamesQueryResult> {
	const names = await fetchNamesFromSupabase(includeHidden);
	if (names === null) {
		throw new Error("Supabase client not available");
	}
	return { names, source: "supabase" };
}

export const namesQueryOptions = (includeHidden: boolean) =>
	queryOptions({
		queryKey: namesQueryKeys.list(includeHidden),
		queryFn: () => fetchNames(includeHidden),
		staleTime: 30_000,
	});

export const hiddenNamesQueryOptions = () =>
	queryOptions({
		queryKey: namesQueryKeys.hiddenList(),
		queryFn: () => fetchHiddenNames(),
		staleTime: 30_000,
	});

// ============================================================================
// Mutations
// ============================================================================

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

export async function addName(params: { name: string; description?: string }): Promise<NameItem> {
	return withSupabase(async (client) => {
		const { data, error } = await client.rpc("add_cat_name", {
			p_name: params.name,
			p_description: params.description || "",
		});
		if (error) {
			throw new Error(error.message || "Failed to add name");
		}
		const row = Array.isArray(data) ? data[0] : data;
		if (!row) {
			throw new Error("No data returned from add_cat_name");
		}
		return mapNameRow(row);
	}, null);
}

/**
 * Legacy support for trending names, now unified in the names feature API.
 */
export async function getTrendingNames(includeHidden = false): Promise<NameItem[]> {
	const result = await fetchNames(includeHidden);
	return result.names;
}

export async function unhideName(userName: string, nameId: IdType): Promise<{ success: boolean; error?: string }> {
	try {
		await toggleNameHidden({
			nameId,
			isCurrentlyHidden: true, // We are unhiding, so currently it is hidden
			userName,
		});
		return { success: true };
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : "Failed to unhide name" };
	}
}
