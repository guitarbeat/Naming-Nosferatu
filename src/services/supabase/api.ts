import { api } from "@/services/apiClient";
import type { NameItem } from "@/shared/types";

interface ApiNameRow {
	id: string | number;
	name: string;
	description?: string | null;
	avgRating?: number | null;
	avg_rating?: number | null;
	createdAt?: string | null;
	created_at?: string | null;
	isHidden?: boolean;
	is_hidden?: boolean;
	isActive?: boolean | null;
	is_active?: boolean | null;
	lockedIn?: boolean;
	locked_in?: boolean;
	status?: string | null;
	provenance?: unknown;
}

interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

function mapNameRow(item: ApiNameRow): NameItem {
	return {
		id: String(item.id),
		name: item.name,
		description: item.description ?? "",
		avgRating: item.avgRating ?? item.avg_rating ?? 1500,
		createdAt: item.createdAt ?? item.created_at ?? null,
		isHidden: item.isHidden ?? item.is_hidden ?? false,
		isActive: item.isActive ?? item.is_active ?? true,
		lockedIn: item.lockedIn ?? item.locked_in ?? false,
		status: (item.status as NameItem["status"]) ?? "candidate",
		provenance: item.provenance as NameItem["provenance"],
		has_user_rating: false,
	};
}

async function getNamesFromSupabase(includeHidden: boolean): Promise<NameItem[]> {
	try {
		const { resolveSupabaseClient } = await import("./client");
		const client = await resolveSupabaseClient();
		if (!client) {
			return [];
		}

		let query = client
			.from("cat_name_options")
			.select("id, name, description, avg_rating, created_at, is_hidden, is_active, locked_in")
			.eq("is_active", true);

		if (!includeHidden) {
			query = query.eq("is_hidden", false);
		}

		const { data, error } = await query.order("avg_rating", { ascending: false }).limit(1000);
		if (error) {
			return [];
		}

		return (data ?? []).map((item) => mapNameRow(item as ApiNameRow));
	} catch {
		return [];
	}
}

export const imagesAPI = {
	list: async (_path = "") => {
		return [] as string[];
	},
	upload: async (_file: File | Blob, _userName: string) => {
		return { path: null, error: "Image uploads not yet supported" } as {
			path: string | null;
			error?: string;
			success?: boolean;
		};
	},
};

export const coreAPI = {
	getTrendingNames: async (includeHidden: boolean = false) => {
		try {
			const data = await api.get<ApiNameRow[]>(`/names?includeHidden=${includeHidden}`);
			return (data ?? []).map((item) => mapNameRow(item));
		} catch {
			// Fallback when /api is not available (static-only deployments).
			return await getNamesFromSupabase(includeHidden);
		}
	},

	getHiddenNames: async () => {
		try {
			const data = await api.get<HiddenNameItem[]>("/names?includeHidden=true");
			return (data ?? []).filter((item) => item.id && item.name) || [];
		} catch {
			const names = await getNamesFromSupabase(true);
			return names
				.filter((item) => item.isHidden ?? item.is_hidden)
				.map((item) => ({
					id: String(item.id),
					name: String(item.name),
					description: typeof item.description === "string" ? item.description : null,
					created_at:
						typeof item.created_at === "string"
							? item.created_at
							: typeof item.createdAt === "string"
								? item.createdAt
								: "",
				}));
		}
	},

	hideName: async (_userName: string, nameId: string | number, isHidden: boolean) => {
		try {
			await api.patch(`/names/${nameId}/hide`, { isHidden });
			return { success: true };
		} catch {
			try {
				const { resolveSupabaseClient } = await import("./client");
				const client = await resolveSupabaseClient();
				if (!client) {
					return { success: false, error: "Failed to hide name" };
				}
				const { error } = await client
					.from("cat_name_options")
					.update({ is_hidden: isHidden })
					.eq("id", String(nameId));
				if (error) {
					return { success: false, error: error.message };
				}
				return { success: true };
			} catch {
				return { success: false, error: "Failed to hide name" };
			}
		}
	},
};

export const hiddenNamesAPI = {
	getHiddenNames: async () => {
		return coreAPI.getHiddenNames();
	},

	hideName: async (_userName: string, nameId: string | number) => {
		return coreAPI.hideName(_userName, nameId, true);
	},

	unhideName: async (_userName: string, nameId: string | number) => {
		return coreAPI.hideName(_userName, nameId, false);
	},
};

export const siteSettingsAPI = {
	getSettings: async () => {
		return {};
	},
	updateSettings: async (_updates: Record<string, unknown>) => {
		return { success: true };
	},
};
