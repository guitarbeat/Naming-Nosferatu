import { isDev, isSupabaseAvailable, resolveSupabaseClient } from "../client";

const isPermissionError = (error: unknown) => {
	if (!error) return false;

	const status =
		(error as { status?: number; statusCode?: number }).status ??
		(error as { status?: number; statusCode?: number }).statusCode;
	const code =
		typeof (error as { code?: string }).code === "string"
			? (error as { code: string }).code.toUpperCase()
			: "";
	const message = ((
		error as { message?: { toLowerCase?: () => string } }
	).message?.toLowerCase?.() ?? "") as string;

	if (status === 401 || status === 403) return true;
	if (status === 400 && message.includes("row-level security")) return true;
	if (
		code === "42501" ||
		code === "PGRST301" ||
		code === "PGRST302" ||
		code === "PGRST303"
	) {
		return true;
	}
	return message.includes("only admins") || message.includes("permission");
};

export const hiddenNamesAPI = {
	/**
	 * Hide a name globally for all users (admin only).
	 */
	async hideName(userName: string, nameId: string | number) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			if (!nameId) return { success: false, error: "Name ID is required" };

			const client = await resolveSupabaseClient();
			if (!client)
				return { success: false, error: "Supabase client unavailable" };

			const { error } = await (client as any).rpc("toggle_name_visibility", {
				p_name_id: nameId,
				p_hide: true,
				p_user_name: userName,
			});

			if (error) {
				if (isPermissionError(error)) {
					const permissionError = new Error(
						"Only admins can hide names",
					) as any;
					permissionError.code = "NOT_ADMIN";
					permissionError.originalError = error;
					throw permissionError;
				}
				throw error;
			}

			return { success: true, scope: "global" };
		} catch (error) {
			if (isDev) console.error("Error hiding name globally:", error);
			throw error;
		}
	},

	/**
	 * Unhide a name globally for all users (admin only).
	 */
	async unhideName(userName: string, nameId: string | number) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			if (!nameId) return { success: false, error: "Name ID is required" };

			const client = await resolveSupabaseClient();
			if (!client)
				return { success: false, error: "Supabase client unavailable" };

			const { error } = await (client as any).rpc("toggle_name_visibility", {
				p_name_id: nameId,
				p_hide: false,
				p_user_name: userName,
			});

			if (error) {
				if (isPermissionError(error)) {
					const permissionError = new Error(
						"Only admins can unhide names",
					) as any;
					permissionError.code = "NOT_ADMIN";
					permissionError.originalError = error;
					throw permissionError;
				}
				throw error;
			}

			return { success: true, scope: "global" };
		} catch (error) {
			if (isDev) console.error("Error unhiding name globally:", error);
			throw error;
		}
	},

	/**
	 * Hide multiple names globally (admin only)
	 */
	async hideNames(userName: string, nameIds: (string | number)[]) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			if (!nameIds || nameIds.length === 0) {
				return { success: false, error: "No names provided", processed: 0 };
			}

			const results: any[] = [];
			let processed = 0;
			const errors: string[] = [];

			for (const nameId of nameIds) {
				try {
					const result = await this.hideName(userName, nameId);
					results.push({
						nameId,
						success: result.success,
						scope: (result as any).scope || null,
					});
					if (result.success) processed++;
					else
						errors.push(
							`Failed to hide ${nameId}: ${(result as any).error || "Unknown error"}`,
						);
				} catch (error) {
					const errorMsg = (error as any).message || String(error);
					results.push({ nameId, success: false, error: errorMsg });
					errors.push(`Failed to hide ${nameId}: ${errorMsg}`);
				}
			}

			if (processed === 0) {
				return {
					success: false,
					error: errors.join("; "),
					processed: 0,
					results,
				};
			}

			return {
				success: true,
				processed,
				results,
				errors: errors.length > 0 ? errors : undefined,
			};
		} catch (error) {
			if (isDev)
				console.error("[hiddenNamesAPI.hideNames] Error hiding names:", error);
			throw error;
		}
	},

	/**
	 * Unhide multiple names globally (admin only)
	 */
	async unhideNames(userName: string, nameIds: (string | number)[]) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			if (!nameIds || nameIds.length === 0)
				return { success: true, processed: 0 };

			const results: any[] = [];
			let processed = 0;

			for (const nameId of nameIds) {
				try {
					const result = await this.unhideName(userName, nameId);
					results.push({
						nameId,
						success: result.success,
						scope: (result as any).scope || null,
					});
					if (result.success) processed++;
				} catch (error) {
					results.push({
						nameId,
						success: false,
						error: (error as any).message || String(error),
					});
				}
			}

			return { success: true, processed, results };
		} catch (error) {
			if (isDev) console.error("Error unhiding names:", error);
			throw error;
		}
	},

	/**
	 * Get globally hidden names (admin-set)
	 */
	async getHiddenNames() {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client
				.from("cat_name_options")
				.select("id, name, description, updated_at")
				.eq("is_hidden", true);

			if (error) throw error;

			return (data || []).map((item: any) => ({
				name_id: item.id,
				updated_at: item.updated_at,
				cat_name_options: {
					id: item.id,
					name: item.name,
					description: item.description,
				},
			}));
		} catch (error) {
			if (isDev) console.error("Error fetching hidden names:", error);
			return [];
		}
	},
};
