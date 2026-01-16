import { withSupabase } from "../../../shared/services/supabase/client";

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface UserRole {
	user_name: string;
	role: string;
}

export const adminAPI = {
	/**
	 * List application users
	 */
	listUsers: async ({ searchTerm, limit = 200 }: { searchTerm?: string; limit?: number } = {}) => {
		return withSupabase(
			async (client) => {
				let query = client
					.from("cat_app_users")
					.select("user_name, updated_at", { count: "exact" });

				if (searchTerm) {
					query = query.ilike("user_name", `%${searchTerm}%`);
				}

				const { data, count, error } = await query
					.order("user_name", { ascending: true })
					.limit(limit);

				if (error) {
					console.error("Error listing users:", error);
					return { users: [], count: 0 };
				}

				// Get roles for these users
				if (data && data.length > 0) {
					const userNames = data.map((u) => u.user_name);
					const { data: roles, error: rolesError } = await client
						.from("user_roles")
						.select("user_name, role")
						.in("user_name", userNames);

					if (!rolesError && roles) {
						const roleMap = new Map(roles.map((r) => [r.user_name, r.role]));
						return {
							users: data.map((u) => ({
								...u,
								role: roleMap.get(u.user_name) || "user",
							})),
							count: count || 0,
						};
					}
				}

				return {
					users: (data || []).map((u) => ({ ...u, role: "user" })),
					count: count || 0,
				};
			},
			{ users: [], count: 0 },
		);
	},
};
