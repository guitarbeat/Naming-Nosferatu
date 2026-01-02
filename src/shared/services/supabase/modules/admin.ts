import { isSupabaseAvailable, resolveSupabaseClient } from "../client";

interface UserRole {
	user_name: string;
	role: string;
}

export const adminAPI = {
	/**
	 * List application users
	 */
	async listUsers({
		searchTerm,
		limit = 200,
	}: {
		searchTerm?: string;
		limit?: number;
	} = {}) {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			let usersQuery = client
				.from("cat_app_users")
				.select("user_name, created_at, updated_at")
				.order("user_name", { ascending: true });

			if (searchTerm)
				usersQuery = usersQuery.ilike("user_name", `%${searchTerm}%`);
			if (Number.isFinite(limit) && limit > 0)
				usersQuery = usersQuery.limit(limit);

			const { data: users, error: usersError } = await usersQuery;
			if (usersError || !users) return [];

			const userNames = users.map((u) => u.user_name);
			let roles: UserRole[] | null = null;
			try {
				const result = await client
					.from("user_roles" as any)
					.select("user_name, role")
					.in("user_name", userNames);
				roles =
					(result.data as any[])?.map((r) => ({
						user_name: r.user_name || "",
						role: r.role || "user",
					})) || null;
			} catch (err) {
				console.error("Error fetching user roles:", err);
			}

			const roleMap = new Map<string, { role: string }[]>();
			(roles || []).forEach((r) => {
				if (!roleMap.has(r.user_name)) roleMap.set(r.user_name, []);
				roleMap.get(r.user_name)?.push({ role: r.role });
			});

			return users.map((u) => ({
				...u,
				user_roles: roleMap.get(u.user_name) || [],
			}));
		} catch (error) {
			console.error("Unexpected error fetching user list for admin:", error);
			return [];
		}
	},
};
