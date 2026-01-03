import { isDev, resolveSupabaseClient } from "../../client";
import type { NameItem } from "./types";

export const coreAPI = {
	/**
	 * Get all names with descriptions and ratings
	 * @param {boolean} includeHidden - If true, include hidden names (for admin views)
	 */
	async getNamesWithDescriptions(includeHidden: boolean = false) {
		try {
			const client = await resolveSupabaseClient();

			if (!client) {
				if (isDev) {
					console.warn("Supabase not available, using fallback names");
				}
				const fallbackNames = [
					"aaron",
					"fix",
					"the",
					"whiskers",
					"shadow",
					"luna",
					"felix",
					"milo",
				].map((name) => ({
					id: name,
					name: name,
					description: "temporary fallback — Supabase not configured",
					avg_rating: 1500,
					popularity_score: 0,
					total_tournaments: 0,
					is_active: true,
					created_at: new Date().toISOString(),
					updated_at: null,
					user_rating: null,
					user_wins: 0,
					user_losses: 0,
					isHidden: false,
					has_user_rating: false,
				}));
				return fallbackNames;
			}

			let query = client
				.from("cat_name_options")
				.select(`
					id,
					name,
					description,
					created_at,
					avg_rating,
					is_active,
					is_hidden
				`)
				.eq("is_active", true)
				.order("avg_rating", { ascending: false });

			if (!includeHidden) {
				query = query.eq("is_hidden", false);
			}

			const { data, error } = await query;

			if (error) {
				console.error("Error fetching names with descriptions:", error);
				return [];
			}

			if (!data || data.length === 0) {
				console.warn("No active names found in database, using fallback names");
				return [
					"aaron",
					"fix",
					"the",
					"whiskers",
					"shadow",
					"luna",
					"felix",
					"milo",
				].map((name) => ({
					id: name,
					name: name,
					description: "temporary fallback — no active names in database",
					avg_rating: 1500,
					popularity_score: 0,
					total_tournaments: 0,
					is_active: true,
					created_at: new Date().toISOString(),
					updated_at: null,
					user_rating: null,
					user_wins: 0,
					user_losses: 0,
					isHidden: false,
					has_user_rating: false,
				}));
			}

			return (data as unknown as NameItem[]).map((item) => ({
				...item,
				updated_at: null,
				user_rating: null,
				user_wins: 0,
				user_losses: 0,
				isHidden: item.is_hidden || false,
				has_user_rating: false,
			}));
		} catch (error) {
			if (isDev) {
				console.error("Error fetching names:", error);
			}
			throw error;
		}
	},

	/**
	 * Add a new name option
	 */
	async addName(
		name: string,
		description: string = "",
		userName: string | null = null,
	) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			if (userName?.trim()) {
				try {
					await client.rpc("set_user_context", {
						user_name_param: userName.trim(),
					});
				} catch (rpcError) {
					if (isDev) {
						console.warn("Failed to set user context for RLS:", rpcError);
					}
				}
			}

			const { data, error } = await client
				.from("cat_name_options")
				.insert([{ name: name.trim(), description: description.trim() }])
				.select()
				.single();

			if (error) {
				console.error("Error adding name:", error);
				return { success: false, error: error.message || "Failed to add name" };
			}
			return { success: true, data };
		} catch (error) {
			if (isDev) {
				console.error("Error adding name:", error);
			}
			return {
				success: false,
				error:
					(error as { message?: string }).message || "Unknown error occurred",
			};
		}
	},

	/**
	 * Remove a name option
	 */
	async removeName(name: string) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			const { error } = await client
				.from("cat_name_options")
				.delete()
				.eq("name", name);

			if (error) {
				console.error("Error removing name:", error);
				return {
					success: false,
					error: error.message || "Failed to remove name",
				};
			}
			return { success: true };
		} catch (error) {
			if (isDev) {
				console.error("Error removing name:", error);
			}
			return {
				success: false,
				error:
					(error as { message?: string }).message || "Unknown error occurred",
			};
		}
	},
};
