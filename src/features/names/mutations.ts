import { isRpcSignatureError } from "@/shared/lib/errors";
import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";
import type { IdType } from "@/shared/types";

export async function toggleNameHidden(params: {
	nameId: IdType;
	isCurrentlyHidden: boolean;
	userName: string;
}): Promise<void> {
	const { isCurrentlyHidden, nameId, userName } = params;
	const client = await resolveSupabaseClient();
	const trimmedUserName = userName.trim();

	if (!client) {
		throw new Error("Supabase client not available");
	}

	if (trimmedUserName) {
		await client.rpc("set_user_context", { user_name_param: trimmedUserName });
	}

	const { data, error } = await client.rpc("toggle_name_visibility", {
		p_name_id: String(nameId),
		p_hide: !isCurrentlyHidden,
		p_user_name: trimmedUserName || undefined,
	});

	if (error) {
		throw error;
	}
	if (data !== true) {
		throw new Error("Failed to update name visibility");
	}
}

export async function toggleNameLocked(params: {
	nameId: IdType;
	isCurrentlyLocked: boolean;
	userName: string;
}): Promise<void> {
	const { isCurrentlyLocked, nameId, userName } = params;
	const client = await resolveSupabaseClient();
	const trimmedUserName = userName.trim();

	if (!client) {
		throw new Error("Supabase client not available");
	}

	if (trimmedUserName) {
		try {
			await client.rpc("set_user_context", { user_name_param: trimmedUserName });
		} catch {
			// Best-effort context for legacy RPC variants.
		}
	}

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

	if (result.data !== true) {
		throw new Error("Failed to toggle locked status");
	}
}
