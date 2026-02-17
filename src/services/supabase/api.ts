/**
 * @module supabaseAPI
 * @description Consolidated Supabase API combining image, name management, and site settings operations.
 * Consolidates: imageService, nameService, siteSettingsService into a single API layer.
 */

import { api } from "@/services/apiClient";
import type { NameItem } from "@/shared/types";
import { withSupabase } from "./client";

/* ==========================================================================
   IMAGES API
   ========================================================================== */

export const imagesAPI = {
	/**
	 * List all images in the cat-photos bucket
	 */
	list: async (path = "") => {
		return withSupabase(async (client) => {
			const { data, error } = await client.storage.from("cat-photos").list(path);
			if (error) {
				console.error("Error listing images:", error);
				return [];
			}
			// Map to public URLs
			return data.map((file) => {
				const { data: urlData } = client.storage
					.from("cat-photos")
					.getPublicUrl(`${path}${file.name}`);
				return urlData.publicUrl;
			});
		}, [] as string[]);
	},

	/**
	 * Upload an image to the cat-photos bucket
	 */
	upload: async (file: File | Blob, userName: string) => {
		return withSupabase(
			async (client) => {
				const fileName = `${Date.now()}-${userName}-${(file as File).name || "blob"}`;
				const { data, error } = await client.storage.from("cat-photos").upload(fileName, file);

				if (error) {
					console.error("Upload error:", error);
					return { path: null, error: error.message };
				}

				const { data: urlData } = client.storage.from("cat-photos").getPublicUrl(data.path);
				return { path: urlData.publicUrl, success: true };
			},
			{ path: null, error: "Supabase not configured" },
		);
	},
};

/* ==========================================================================
   NAMES API
   ========================================================================== */

interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

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

	reorderNames: async (orders: { id: string | number; sortOrder: number }[], userName: string) => {
		try {
			return await api.post<{ success: boolean; error?: string }>("/names/reorder", {
				orders,
				userName,
			});
		} catch (error: any) {
			return {
				success: false,
				error: error.message || "Failed to reorder names",
			};
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

/* ==========================================================================
   SITE SETTINGS API
   ========================================================================== */

/**
 * Database update payload - field names match Supabase column names (snake_case required)
 */
interface CatChosenNameUpdate {
	first_name: string;
	middle_names?: string | string[];
	last_name?: string;
	greeting_text?: string;
	show_banner?: boolean;
}

export const siteSettingsAPI = {
	/**
	 * Get cat's chosen name
	 */
	getCatChosenName: async () => {
		try {
			return await api.get<any>("/settings/cat-chosen-name");
		} catch {
			return null;
		}
	},

	/**
	 * Update cat's chosen name
	 */
	updateCatChosenName: async (nameData: CatChosenNameUpdate, _userName: string) => {
		try {
			const result = await api.post<{ success: boolean; data?: any; error?: string }>(
				"/settings/cat-chosen-name",
				nameData,
			);
			return result;
		} catch (error: any) {
			return { success: false, error: error.message || "Failed to update cat chosen name" };
		}
	},
};
