import { queryOptions } from "@tanstack/react-query";
import useAppStore from "@/store/appStore";
import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";
import { mapNameRow } from "./mapNameRow";
import type { NameItem } from "@/shared/types";

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

/** Verifies that the current user has admin privileges. */
function assertAdmin(message = "Admin privileges required"): void {
	const user = useAppStore.getState().user;
	if (!user?.isAdmin) {
		throw new Error(message);
	}
}

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

export async function fetchNames(includeHidden: boolean): Promise<NamesQueryResult> {
	const names = await fetchNamesFromSupabase(includeHidden);
	if (!names) {
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
