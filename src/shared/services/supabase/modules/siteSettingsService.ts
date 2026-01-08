import { withSupabase } from "../client";

/**
 * Database update payload - field names match Supabase column names (snake_case required)
 */
export interface CatChosenNameUpdate {
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
				} catch {
					/* ignore */
				}

				const { data, error } = await client
					.from("cat_chosen_name")
					.insert([nameData as any])
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
