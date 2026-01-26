import { resolveSupabaseClient, withSupabase } from "@supabase/client";

/* ==========================================================================
   CONSTANTS & CONFIG
   ========================================================================== */

const USER_ROLES = {
	USER: "user",
	MODERATOR: "moderator",
	ADMIN: "admin",
} as const;

const ROLE_PRIORITY = {
	[USER_ROLES.USER]: 0,
	[USER_ROLES.MODERATOR]: 1,
	[USER_ROLES.ADMIN]: 2,
};

/* ==========================================================================
   ROLE UTILITIES (Internal)
   ========================================================================== */

const normalizeRole = (role: string | null | undefined): string | null =>
	role?.toLowerCase?.() ?? null;

const compareRoles = (
	currentRole: string | null | undefined,
	requiredRole: string | null | undefined,
): boolean => {
	const current = ROLE_PRIORITY[normalizeRole(currentRole) as keyof typeof ROLE_PRIORITY] ?? -1;
	const required =
		ROLE_PRIORITY[normalizeRole(requiredRole) as keyof typeof ROLE_PRIORITY] ??
		Number.POSITIVE_INFINITY;
	return current >= required;
};

/* ==========================================================================
   AUTH LOGIC
   ========================================================================== */

export async function isUserAdmin(userIdOrName: string): Promise<boolean> {
	if (!userIdOrName) {
		return false;
	}

	try {
		// Simplified check reusing existing pattern
		const client = await resolveSupabaseClient();
		if (!client) {
			return false;
		}

		const { data, error } = await client
			.from("user_roles")
			.select("role")
			.eq("user_name", userIdOrName)
			.maybeSingle();

		if (error || !data) {
			return false;
		}

		return compareRoles(data.role, USER_ROLES.ADMIN);
	} catch (e) {
		console.error("Error checking admin status", e);
		return false;
	}
}

export const adminAPI = {
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

				// Fetch roles
				if (data && data.length > 0) {
					const userNames = data.map((u) => u.user_name);
					const { data: roles } = await client
						.from("user_roles")
						.select("user_name, role")
						.in("user_name", userNames);

					const roleMap = new Map(roles?.map((r: any) => [r.user_name, r.role]) || []);
					return {
						users: data.map((u) => ({
							...u,
							role: roleMap.get(u.user_name) || "user",
						})),
						count: count || 0,
					};
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
