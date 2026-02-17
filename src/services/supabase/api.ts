import { api } from "@/services/apiClient";
import type { NameItem } from "@/shared/types";

interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
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
			const data = await api.get<any[]>(`/names?includeHidden=${includeHidden}`);
			return (data ?? []).map((item: any) => ({
				id: String(item.id),
				name: item.name,
				description: item.description,
				avgRating: item.avgRating ?? 1500,
				createdAt: item.createdAt,
				isHidden: item.isHidden ?? false,
				isActive: item.isActive ?? true,
				status: item.status ?? "candidate",
				provenance: item.provenance,
				has_user_rating: false,
			})) as NameItem[];
		} catch {
			return [];
		}
	},

	getHiddenNames: async () => {
		try {
			const data = await api.get<HiddenNameItem[]>("/names?includeHidden=true");
			return (data ?? []).filter((item) => item.id && !item.name) || [];
		} catch {
			return [];
		}
	},

	hideName: async (_userName: string, nameId: string | number, _isHidden: boolean) => {
		try {
			await api.post(`/names/${nameId}/hide`, {});
			return { success: true };
		} catch {
			return { success: false, error: "Failed to hide name" };
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
