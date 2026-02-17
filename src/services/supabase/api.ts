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
				...item,
				updated_at: null,
				user_rating: null,
				user_wins: 0,
				user_losses: 0,
				isHidden: item.is_hidden || false,
				has_user_rating: false,
			})) as NameItem[];
		} catch (error) {
			console.error("Error fetching names:", error);
			throw error;
		}
	},

	addName: async (name: string, description: string = "", _userName: string | null = null) => {
		try {
			const result = await api.post<{ success: boolean; data?: any; error?: string }>("/names", {
				name: name.trim(),
				description: description.trim(),
				status: "candidate",
				provenance: [
					{
						action: "created",
						timestamp: new Date().toISOString(),
						details: { source: "user_input" },
					},
				],
			});
			return result;
		} catch (error: any) {
			return {
				success: false,
				error: error.message || "Failed to add name",
			};
		}
	},

	deleteByName: async (name: string) => {
		try {
			return await api.delete<{ success: boolean; error?: string }>(
				`/names/by-name/${encodeURIComponent(name)}`,
			);
		} catch (error: any) {
			return { success: false, error: error.message || "Failed to remove name" };
		}
	},

	deleteById: async (nameId: string | number) => {
		try {
			return await api.delete<{ success: boolean; error?: string }>(`/names/${nameId}`);
		} catch (error: any) {
			return { success: false, error: error.message || "Failed to delete name" };
		}
	},
};

export const hiddenNamesAPI = {
	hideName: async (_userName: string, nameId: string | number) => {
		try {
			await api.post(`/names/${nameId}/toggle-hidden`, { isHidden: true });
			return { nameId, success: true } as {
				nameId: string | number;
				success: boolean;
				error?: string;
			};
		} catch (error: any) {
			return { nameId, success: false, error: error.message } as {
				nameId: string | number;
				success: boolean;
				error?: string;
			};
		}
	},

	unhideName: async (_userName: string, nameId: string | number) => {
		try {
			await api.post(`/names/${nameId}/toggle-hidden`, { isHidden: false });
			return { nameId, success: true } as {
				nameId: string | number;
				success: boolean;
				error?: string;
			};
		} catch (error: any) {
			return { nameId, success: false, error: error.message } as {
				nameId: string | number;
				success: boolean;
				error?: string;
			};
		}
	},

	hideNames: async (_userName: string, nameIds: (string | number)[]) => {
		try {
			return await api.post<{ nameId: string | number; success: boolean; error?: string }[]>(
				"/names/bulk-toggle-hidden",
				{ nameIds, isHidden: true },
			);
		} catch {
			return nameIds.map((id) => ({
				nameId: id,
				success: false,
				error: "Request failed",
			}));
		}
	},

	unhideNames: async (_userName: string, nameIds: (string | number)[]) => {
		try {
			return await api.post<{ nameId: string | number; success: boolean; error?: string }[]>(
				"/names/bulk-toggle-hidden",
				{ nameIds, isHidden: false },
			);
		} catch {
			return nameIds.map((id) => ({
				nameId: id,
				success: false,
				error: "Request failed",
			}));
		}
	},

	getHiddenNames: async () => {
		try {
			return await api.get<HiddenNameItem[]>("/names/hidden");
		} catch (error) {
			console.error("Error fetching hidden names:", error);
			return [];
		}
	},
};


