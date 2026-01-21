import { withSupabase } from "@supabase/client";
import type { NameItem } from "../../../../types/components";

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	created_at: string;
}

export const coreAPI = {
	/**
	 * Get all names with descriptions and ratings
	 */
	getNamesWithDescriptions: async (includeHidden: boolean = false) => {
		return withSupabase(async (client) => {
			let query = client
				.from("cat_name_options")
				.select(
					"id, name, description, created_at, avg_rating, is_active, is_hidden, status, provenance",
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
				return [];
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
		}, []);
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
	 * Remove a name option
	 */
	removeName: async (name: string) => {
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

	deleteName,
};

/**
 * Delete a name by ID
 */
export async function deleteName(nameId: string | number) {
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

export const hiddenNamesAPI = {
	hideName: async (userName: string, nameId: string | number) => {
		return withSupabase(
			async (client) => {
				try {
					await client.rpc("set_user_context", { user_name_param: userName });
				} catch {
					/* ignore */
				}

				const { error } = await client
					.from("cat_name_options")
					.update({ is_hidden: true })
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
	},

	/**
	 * Unhide a name globally for all users (admin only).
	 */
	unhideName: async (userName: string, nameId: string | number) => {
		return withSupabase(
			async (client) => {
				try {
					await client.rpc("set_user_context", { user_name_param: userName });
				} catch {
					/* ignore */
				}

				const { error } = await client
					.from("cat_name_options")
					.update({ is_hidden: false })
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
	},

	/**
	 * Hide multiple names globally (admin only)
	 */
	hideNames: async (userName: string, nameIds: (string | number)[]) => {
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
							.update({ is_hidden: true })
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
	},

	/**
	 * Unhide multiple names globally (admin only)
	 */
	unhideNames: async (userName: string, nameIds: (string | number)[]) => {
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
							.update({ is_hidden: false })
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
