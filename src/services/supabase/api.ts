/**
 * @module supabaseAPI
 * @description Consolidated Supabase API combining image, name management, and site settings operations.
 * Consolidates: imageService, nameService, siteSettingsService into a single API layer.
 */

import type { NameItem } from "@/types/appTypes";
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
	 * Upload an image to the cat-photos bucket (admin only)
	 */
	upload: async (file: File | Blob, userName: string) => {
		return withSupabase(
			async (client) => {
				// Check if user is admin
				const { data: adminCheck } = await client.rpc('check_user_role_by_name', { 
					required_role: 'admin',
					user_name_param: userName 
				});
				
				if (!adminCheck) {
					return { path: null, error: "Admin access required for image uploads" };
				}

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

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

/**
 * Shared helper for updating hidden status of a single name
 */
async function updateHiddenStatus(userName: string, nameId: string | number, isHidden: boolean) {
	return withSupabase(
		async (client) => {
			try {
				await client.rpc("set_user_context", { user_name_param: userName });
			} catch {
				/* ignore */
			}

			const { error } = await client
				.from("cat_name_options")
				.update({ is_hidden: isHidden })
				.eq("id", String(nameId));

			if (error) {
				throw error;
			}
			return { nameId, success: true } as {
				nameId: string | number;
				success: boolean;
				error?: string;
			};
		},
		{
			nameId: String(nameId),
			success: false,
			error: "Supabase not configured",
		} as {
			nameId: string | number;
			success: boolean;
			error?: string;
		},
	);
}

/**
 * Shared helper for updating hidden status of multiple names
 */
async function updateHiddenStatuses(
	userName: string,
	nameIds: (string | number)[],
	isHidden: boolean,
) {
	return withSupabase(
		async (client) => {
			try {
				await client.rpc("set_user_context", { user_name_param: userName });
			} catch {
				/* ignore */
			}

			const results = await Promise.all(
				nameIds.map(async (id) => {
					const { error } = await client
						.from("cat_name_options")
						.update({ is_hidden: isHidden })
						.eq("id", String(id));
					return { nameId: id, success: !error, error: error?.message };
				}),
			);
			return results;
		},
		nameIds.map((id) => ({
			nameId: id,
			success: false,
			error: "Supabase not configured",
		})),
	);
}

/**
 * Delete a name by ID
 */
async function deleteById(nameId: string | number) {
	return withSupabase(
		async (client) => {
			const { error } = await client.from("cat_name_options").delete().eq("id", String(nameId));
			if (error) {
				return {
					success: false,
					error: error.message || "Failed to delete name",
				};
			}
			return { success: true };
		},
		{ success: false, error: "Supabase not configured" },
	);
}

export const coreAPI = {
	/**
	 * Get all names with descriptions and ratings
	 */
	getTrendingNames: async (includeHidden: boolean = false) => {
		const isAvailable = await import("@supabase/client").then((m) => m.isSupabaseAvailable());
		if (!isAvailable) {
			throw new Error("Supabase is not configured or unavailable");
		}

		return withSupabase(async (client) => {
			let query = client
				.from("cat_name_options")
				.select(
					"id, name, description, created_at, avg_rating, is_active, is_hidden, locked_in, status, provenance",
				)
				.eq("is_active", true)
				.order("avg_rating", { ascending: false })
				.limit(1000);

			if (!includeHidden) {
				query = query.eq("is_hidden", false);
			}

			const { data, error } = await query;
			if (error) {
				console.error("Error fetching names with descriptions:", error);
				throw error;
			}

			return ((data ?? []) as unknown as NameItem[]).map((item) => ({
				...item,
				updated_at: null,
				user_rating: null,
				user_wins: 0,
				user_losses: 0,
				isHidden: item.is_hidden || false,
				has_user_rating: false,
			}));
		}, [] as NameItem[]);
	},

	/**
	 * Add a new name option
	 */
	addName: async (name: string, description: string = "", userName: string | null = null) => {
		return withSupabase(
			async (client) => {
				if (userName?.trim()) {
					try {
						await client.rpc("set_user_context", {
							user_name_param: userName.trim(),
						});
					} catch {
						/* ignore */
					}
				}

				const { data, error } = await client
					.from("cat_name_options")
					.insert([
						{
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
						},
					])
					.select()
					.single();

				if (error) {
					console.error("Error adding name:", error);
					return {
						success: false,
						error: error.message || "Failed to add name",
					};
				}
				return { success: true, data };
			},
			{ success: false, error: "Supabase not configured or request failed" },
		);
	},

	/**
	 * Remove a name option by its name string
	 */
	deleteByName: async (name: string) => {
		return withSupabase(
			async (client) => {
				const { error } = await client.from("cat_name_options").delete().eq("name", name);
				if (error) {
					return {
						success: false,
						error: error.message || "Failed to remove name",
					};
				}
				return { success: true };
			},
			{ success: false, error: "Supabase not configured" },
		);
	},

	deleteById,
};

export const hiddenNamesAPI = {
	hideName: async (userName: string, nameId: string | number) => {
		return updateHiddenStatus(userName, nameId, true);
	},

	/**
	 * Unhide a name globally for all users (admin only).
	 */
	unhideName: async (userName: string, nameId: string | number) => {
		return updateHiddenStatus(userName, nameId, false);
	},

	/**
	 * Hide multiple names globally (admin only)
	 */
	hideNames: async (userName: string, nameIds: (string | number)[]) => {
		return updateHiddenStatuses(userName, nameIds, true);
	},

	/**
	 * Unhide multiple names globally (admin only)
	 */
	unhideNames: async (userName: string, nameIds: (string | number)[]) => {
		return updateHiddenStatuses(userName, nameIds, false);
	},

	/**
	 * Get globally hidden names (admin-set)
	 */
	getHiddenNames: async () => {
		return withSupabase(async (client) => {
			const { data, error } = await client
				.from("cat_name_options")
				.select("id, name, description, created_at")
				.eq("is_hidden", true);

			if (error) {
				console.error("Error fetching hidden names:", error);
				return [];
			}
			return (data || []) as unknown as HiddenNameItem[];
		}, []);
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
		return withSupabase(async (client) => {
			const { data, error } = await client
				.from("cat_chosen_name")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

			if (error) {
				console.error("Error fetching cat chosen name:", error);
				return null;
			}
			return data;
		}, null);
	},

	/**
	 * Update cat's chosen name
	 */
	updateCatChosenName: async (nameData: CatChosenNameUpdate, userName: string) => {
		return withSupabase(
			async (client) => {
				try {
					await client.rpc("set_user_context", {
						user_name_param: userName,
					});
				} catch (err) {
					if (import.meta.env.DEV) {
						console.warn("Could not set user context:", err);
					}
				}

				const { data, error } = await client
					.from("cat_chosen_name")
					.insert([nameData])
					.select()
					.single();

				if (error) {
					console.error("Error updating cat chosen name:", error);
					return { success: false, error: error.message };
				}
				return { success: true, data };
			},
			{ success: false, error: "Supabase not configured" },
		);
	},
};
