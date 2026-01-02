import { resolveSupabaseClient } from "../client";

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
	async getCatChosenName() {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return null;

			const { data, error } = await client
				.from("site_settings")
				.select("value")
				.eq("key", "cat_chosen_name")
				.maybeSingle();

			if (error) return null;
			return data?.value || null;
		} catch (_error) {
			return null;
		}
	},

	/**
	 * Update cat's chosen name
	 */
	async updateCatChosenName(nameData: CatChosenNameUpdate, userName: string) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			if (!nameData.first_name || nameData.first_name.trim() === "") {
				return { success: false, error: "First name is required" };
			}

			let middleNames = nameData.middle_names || [];
			if (typeof middleNames === "string") {
				middleNames = middleNames
					.split(",")
					.map((n) => n.trim())
					.filter(Boolean);
			}

			const nameParts = [
				nameData.first_name.trim(),
				...middleNames,
				nameData.last_name?.trim() || "",
			].filter(Boolean);
			const displayName = nameParts.join(" ");

			const value = {
				first_name: nameData.first_name.trim(),
				middle_names: middleNames,
				last_name: nameData.last_name?.trim() || "",
				greeting_text: nameData.greeting_text || "Hello! My name is",
				display_name: displayName,
				is_set: true,
				show_banner: nameData.show_banner !== false,
			};

			const { data, error } = await client
				.from("site_settings")
				.update({ value, updated_by: userName })
				.eq("key", "cat_chosen_name")
				.select()
				.single();

			if (error)
				return {
					success: false,
					error: error.message || "Failed to update cat name",
				};
			return { success: true, data: data.value };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	},
};
