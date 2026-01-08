import type { NameItem } from "../../../../types/components";
import { isDev, isSupabaseAvailable, resolveSupabaseClient, withSupabase } from "../client";

// --- Types & Helpers ---

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
interface UserRole {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_name: string;
	role: string;
}

interface FileObject {
	name: string;
	metadata?: { size?: number };
	size?: number;
}

/**
 * Database update payload - field names match Supabase column names (snake_case required)
 */
export interface CatChosenNameUpdate {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	first_name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	middle_names?: string | string[];
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	last_name?: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	greeting_text?: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	show_banner?: boolean;
}

export interface NameStats {
	totalRating: number;
	count: number;
	totalWins: number;
	totalLosses: number;
}

export interface SelectionStats {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	name_id: string | number;
	name: string;
	count: number;
}

export interface AnalyticsSelectionStats {
	count: number;
	users: Set<string>;
}

export interface RatingStats {
	totalRating: number;
	count: number;
	wins: number;
	losses: number;
	users: Set<string>;
}

export interface RatingInfo {
	rating: number;
	wins: number;
}

// Duplicate TournamentDisplayData removed - now in tournamentService.ts

// Duplicate TournamentDisplayData removed

interface PermissionError extends Error {
	code: string;
	originalError: unknown;
}

interface HideResult {
	nameId: string | number;
	success: boolean;
	scope?: string | null;
	error?: string;
}

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
interface HiddenNameItem {
	id: string;
	name: string;
	description: string | null;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	created_at: string;
}

const isPermissionError = (error: unknown) => {
	if (!error) {
		return false;
	}

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

	if (status === 401 || status === 403) {
		return true;
	}
	if (status === 400 && message.includes("row-level security")) {
		return true;
	}
	if (code === "42501" || code === "PGRST301" || code === "PGRST302" || code === "PGRST303") {
		return true;
	}
	return message.includes("only admins") || message.includes("permission");
};

// --- APIs ---

export const adminAPI = {
	/**
	 * List application users
	 */
	async listUsers({ searchTerm, limit = 200 }: { searchTerm?: string; limit?: number } = {}) {
		return withSupabase(async (client) => {
			let usersQuery = client
				.from("cat_app_users")
				.select("user_name, created_at, updated_at")
				.order("user_name", { ascending: true });

			if (searchTerm) {
				usersQuery = usersQuery.ilike("user_name", `%${searchTerm}%`);
			}
			if (Number.isFinite(limit) && limit > 0) {
				usersQuery = usersQuery.limit(limit);
			}

			const { data: users, error: usersError } = await usersQuery;
			if (usersError || !users) {
				return [];
			}

			const userNames = users.map((u) => u.user_name);
			let roles: UserRole[] | null = null;
			try {
				const result = await client
					// biome-ignore lint/suspicious/noExplicitAny: Temporary workaround for Supabase type inference on user_roles
					.from("user_roles" as any)
					.select("user_name, role")
					.in("user_name", userNames);
				roles =
					// biome-ignore lint/suspicious/noExplicitAny: Safe cast for mapped data
					(result.data as any[])?.map((r) => ({
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						user_name: r.user_name || "",
						role: r.role || "user",
					})) || null;
			} catch (err) {
				console.error("Error fetching user roles:", err);
			}

			const roleMap = new Map<string, { role: string }[]>();
			(roles || []).forEach((r) => {
				if (!roleMap.has(r.user_name)) {
					roleMap.set(r.user_name, []);
				}
				roleMap.get(r.user_name)?.push({ role: r.role });
			});

			return users.map((u) => ({
				...u,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				user_roles: roleMap.get(u.user_name) || [],
			}));
		}, []);
	},
};

export const imagesAPI = {
	/**
	 * List images from the `cat-images` bucket.
	 */
	async list(prefix = "", limit = 1000) {
		return withSupabase(async (client) => {
			const { data, error } = await client.storage.from("cat-images").list(prefix, {
				limit,
				sortBy: { column: "updated_at", order: "desc" },
			});

			if (error) {
				if (isDev) {
					console.warn("imagesAPI.list error:", error);
				}
				return [];
			}

			const files = (data || []).filter((f) => f?.name);
			if (!files.length) {
				return [];
			}

			const rankByExt = (name: string) => {
				const n = name.toLowerCase();
				if (n.endsWith(".avif")) return 1;
				if (n.endsWith(".webp")) return 2;
				if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return 3;
				if (n.endsWith(".png")) return 4;
				if (n.endsWith(".gif")) return 5;
				return 9;
			};

			const pickSmaller = (a: FileObject, b: FileObject) => {
				const sizeA = a?.metadata?.size ?? a?.size;
				const sizeB = b?.metadata?.size ?? b?.size;
				if (typeof sizeA === "number" && typeof sizeB === "number") {
					return sizeA <= sizeB ? a : b;
				}
				return rankByExt(a.name) <= rankByExt(b.name) ? a : b;
			};

			const byBase = new Map<string, FileObject>();
			for (const f of files) {
				const base = f.name.replace(/\.[^.]+$/, "").toLowerCase();
				const current = byBase.get(base);
				byBase.set(base, current ? pickSmaller(current, f) : f);
			}

			return Array.from(byBase.values())
				.map((f) => {
					const fullPath = prefix ? `${prefix}/${f.name}` : f.name;
					return client.storage.from("cat-images").getPublicUrl(fullPath).data?.publicUrl;
				})
				.filter(Boolean);
		}, []);
	},

	/**
	 * Upload an image file.
	 */
	async upload(file: File, _userName = "anon", prefix = "") {
		const client = await resolveSupabaseClient();
		if (!client) {
			throw new Error("Supabase not configured");
		}

		const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
		const objectPath = `${prefix ? `${prefix}/` : ""}${Date.now()}-${safe}`;
		const { error } = await client.storage
			.from("cat-images")
			.upload(objectPath, file, { upsert: false });
		if (error) {
			throw error;
		}
		return client.storage.from("cat-images").getPublicUrl(objectPath).data?.publicUrl;
	},
};

export const siteSettingsAPI = {
	/**
	 * Get cat's chosen name
	 */
	async getCatChosenName() {
		return withSupabase(async (client) => {
			const { data, error } = await client
				.from("site_settings")
				.select("value")
				.eq("key", "cat_chosen_name")
				.maybeSingle();

			if (error) return null;
			return data?.value || null;
		}, null);
	},

	/**
	 * Update cat's chosen name
	 */
	async updateCatChosenName(nameData: CatChosenNameUpdate, userName: string) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase not configured" };
			}

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
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				first_name: nameData.first_name.trim(),
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				middle_names: middleNames,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				last_name: nameData.last_name?.trim() || "",
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				greeting_text: nameData.greeting_text || "Hello! My name is",
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				display_name: displayName,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				is_set: true,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				show_banner: nameData.show_banner !== false,
			};

			const { data, error } = await client
				.from("site_settings")
				.update({
					value,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					updated_by: userName,
				})
				.eq("key", "cat_chosen_name")
				.select()
				.single();

			if (error) {
				return {
					success: false,
					error: error.message || "Failed to update cat name",
				};
			}
			return { success: true, data: data.value };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	},
};

// tournamentsAPI moved to features/tournament/services/tournamentService.ts

export const deleteName = async (nameId: string | number) => {
	try {
		if (!(await isSupabaseAvailable())) {
			return { success: false, error: "Supabase not configured" };
		}

		const client = await resolveSupabaseClient();
		if (!client) {
			return { success: false, error: "Supabase not configured" };
		}

		const { error: nameError } = await client
			.from("cat_name_options")
			.select("name")
			.eq("id", String(nameId))
			.single();

		if (nameError?.code === "PGRST116") {
			throw new Error("Name has already been deleted");
		} else if (nameError) {
			throw nameError;
		}

		const { error: deleteError } = await client
			.from("cat_name_options")
			.delete()
			.eq("id", String(nameId));

		if (deleteError) {
			if (deleteError.code === "23503") {
				const { error: updateError } = await client
					.from("cat_name_options")
					.update({
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						is_active: false,
					})
					.eq("id", String(nameId));
				if (updateError) {
					throw updateError;
				}
				return {
					success: true,
					message: "Name deactivated (has related data)",
				};
			}
			throw deleteError;
		}

		return { success: true };
	} catch (error) {
		if (isDev) {
			console.error("Error deleting name:", error);
		}
		return { success: false, error: (error as Error).message || String(error) };
	}
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

			if (!nameId) {
				return { success: false, error: "Name ID is required" };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase client unavailable" };
			}

			// biome-ignore lint/suspicious/noExplicitAny: Workaround for RPC function overload identification
			const { error } = await client.rpc("toggle_name_visibility" as any, {
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_name_id: String(nameId),
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_hide: true,
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_user_name: userName,
			});

			if (error) {
				if (isPermissionError(error)) {
					const permissionError = new Error("Only admins can hide names") as PermissionError;
					permissionError.code = "NOT_ADMIN";
					permissionError.originalError = error;
					throw permissionError;
				}
				throw error;
			}

			return { success: true, scope: "global" };
		} catch (error) {
			if (isDev) {
				console.error("Error hiding name globally:", error);
			}
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

			if (!nameId) {
				return { success: false, error: "Name ID is required" };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase client unavailable" };
			}

			// biome-ignore lint/suspicious/noExplicitAny: Workaround for RPC function overload identification
			const { error } = await client.rpc("toggle_name_visibility" as any, {
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_name_id: String(nameId),
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_hide: false,
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_user_name: userName,
			});

			if (error) {
				if (isPermissionError(error)) {
					const permissionError = new Error("Only admins can unhide names") as PermissionError;
					permissionError.code = "NOT_ADMIN";
					permissionError.originalError = error;
					throw permissionError;
				}
				throw error;
			}

			return { success: true, scope: "global" };
		} catch (error) {
			if (isDev) {
				console.error("Error unhiding name globally:", error);
			}
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

			const results: HideResult[] = [];
			let processed = 0;
			const errors: string[] = [];

			for (const nameId of nameIds) {
				try {
					const result = await this.hideName(userName, nameId);
					results.push({
						nameId,
						success: result.success,
						scope: (result as { scope?: string }).scope || null,
					});
					if (result.success) {
						processed++;
					} else {
						errors.push(
							`Failed to hide ${nameId}: ${(result as { error?: string }).error || "Unknown error"}`,
						);
					}
				} catch (error) {
					const errorMsg = (error as Error).message || String(error);
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
			if (isDev) {
				console.error("[hiddenNamesAPI.hideNames] Error hiding names:", error);
			}
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

			if (!nameIds || nameIds.length === 0) {
				return { success: true, processed: 0 };
			}

			const results: HideResult[] = [];
			let processed = 0;

			for (const nameId of nameIds) {
				try {
					const result = await this.unhideName(userName, nameId);
					results.push({
						nameId,
						success: result.success,
						scope: (result as { scope?: string }).scope || null,
					});
					if (result.success) {
						processed++;
					}
				} catch (error) {
					results.push({
						nameId,
						success: false,
						error: (error as Error).message || String(error),
					});
				}
			}

			return { success: true, processed, results };
		} catch (error) {
			if (isDev) {
				console.error("Error unhiding names:", error);
			}
			throw error;
		}
	},

	/**
	 * Get globally hidden names (admin-set)
	 */
	async getHiddenNames() {
		try {
			if (!(await isSupabaseAvailable())) {
				return [];
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return [];
			}

			const { data, error } = await client
				.from("cat_name_options")
				.select("id, name, description, created_at")
				.eq("is_hidden", true);

			if (error) {
				throw error;
			}

			return (data || []).map((item: HiddenNameItem) => ({
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				name_id: item.id,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				updated_at: item.created_at,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				cat_name_options: {
					id: item.id,
					name: item.name,
					description: item.description,
				},
			}));
		} catch (error) {
			if (isDev) {
				console.error("Error fetching hidden names:", error);
			}
			return [];
		}
	},
};

// --- Consolidated APIs from cat-names-consolidated.ts ---

export const coreAPI = {
	/**
	 * Get all names with descriptions and ratings
	 */
	async getNamesWithDescriptions(includeHidden: boolean = false) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return [];

			let query = client
				.from("cat_name_options")
				.select("id, name, description, created_at, avg_rating, is_active, is_hidden")
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

			return (data as unknown as NameItem[]).map((item) => ({
				...item,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				updated_at: null,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				user_rating: null,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				user_wins: 0,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				user_losses: 0,
				isHidden: item.is_hidden || false,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				has_user_rating: false,
			}));
		} catch (error) {
			if (isDev) console.error("Error fetching names:", error);
			throw error;
		}
	},

	/**
	 * Add a new name option
	 */
	async addName(name: string, description: string = "", userName: string | null = null) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			if (userName?.trim()) {
				try {
					await client.rpc("set_user_context", {
						// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
						user_name_param: userName.trim(),
					});
				} catch {
					/* ignore */
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
			return { success: false, error: (error as Error).message || "Unknown error occurred" };
		}
	},

	/**
	 * Remove a name option
	 */
	async removeName(name: string) {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };
			const { error } = await client.from("cat_name_options").delete().eq("name", name);
			if (error) return { success: false, error: error.message || "Failed to remove name" };
			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message || "Unknown error occurred" };
		}
	},
};

interface SelectionRow {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	name_id: string | number;
	name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	selected_at: string;
}

interface RatingRow {
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	name_id: string | number;
	rating: number;
	wins: number;
	losses: number;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_name: string;
}

interface NameRow {
	id: string | number;
	name: string;
	description: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	avg_rating: number;
	categories: string[];
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	created_at: string;
}

export const analyticsAPI = {
	/**
	 * Get selection popularity
	 */
	async getSelectionPopularity(limit: number | null = 20) {
		try {
			if (!(await isSupabaseAvailable())) return [];
			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client.from("tournament_selections").select("name_id, name");
			if (error) return [];

			const selectionCounts = new Map<string | number, SelectionStats>();
			(data || []).forEach((row) => {
				const r = row as unknown as SelectionRow;
				if (!selectionCounts.has(r.name_id)) {
					selectionCounts.set(r.name_id, { name_id: r.name_id, name: r.name, count: 0 });
				}
				const sc = selectionCounts.get(r.name_id);
				if (sc) sc.count += 1;
			});

			let results = Array.from(selectionCounts.values()).sort((a, b) => b.count - a.count);
			if (limit) results = results.slice(0, limit);

			return results.map((item) => ({
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				name_id: String(item.name_id),
				name: item.name,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				times_selected: item.count,
			}));
		} catch {
			return [];
		}
	},

	/**
	 * Get comprehensive popularity analytics
	 */
	async getPopularityAnalytics(
		limit: number | null = 20,
		userFilter: string | null = "all",
		currentUserName: string | null = null,
	) {
		try {
			if (!(await isSupabaseAvailable())) return [];
			const client = await resolveSupabaseClient();
			if (!client) return [];

			let selectionsQuery = client.from("tournament_selections").select("name_id, name, user_name");
			let ratingsQuery = client
				.from("cat_name_ratings")
				.select("name_id, rating, wins, losses, user_name");

			if (userFilter && userFilter !== "all") {
				const targetUser = userFilter === "current" ? currentUserName : userFilter;
				if (targetUser) {
					selectionsQuery = selectionsQuery.eq("user_name", targetUser);
					ratingsQuery = ratingsQuery.eq("user_name", targetUser);
				}
			}

			const [selectionsResult, ratingsResult, namesResult] = await Promise.all([
				selectionsQuery,
				ratingsQuery,
				client
					.from("cat_name_options")
					.select("id, name, description, avg_rating, categories, created_at")
					.eq("is_active", true)
					.eq("is_hidden", false),
			]);

			const selections = selectionsResult.data || [];
			const ratings = ratingsResult.data || [];
			const names = namesResult.data || [];

			const selectionStats = new Map<string | number, AnalyticsSelectionStats>();
			selections.forEach((item) => {
				const s = item as unknown as SelectionRow;
				if (!selectionStats.has(s.name_id))
					selectionStats.set(s.name_id, { count: 0, users: new Set() });
				const stat = selectionStats.get(s.name_id);
				if (stat) {
					stat.count += 1;
					stat.users.add(s.user_name);
				}
			});

			const ratingStats = new Map<string | number, RatingStats>();
			ratings.forEach((item) => {
				const r = item as unknown as RatingRow;
				if (!ratingStats.has(r.name_id))
					ratingStats.set(r.name_id, {
						totalRating: 0,
						count: 0,
						wins: 0,
						losses: 0,
						users: new Set(),
					});
				const stat = ratingStats.get(r.name_id);
				if (stat) {
					stat.totalRating += Number(r.rating) || 1500;
					stat.count += 1;
					stat.wins += r.wins || 0;
					stat.losses += r.losses || 0;
					stat.users.add(r.user_name);
				}
			});

			const analytics = names.map((item) => {
				const name = item as unknown as NameRow;
				const selStat = selectionStats.get(name.id) || { count: 0, users: new Set() };
				const ratStat = ratingStats.get(name.id) || {
					totalRating: 0,
					count: 0,
					wins: 0,
					losses: 0,
					users: new Set(),
				};

				const avgRating =
					ratStat.count > 0 ? Math.round(ratStat.totalRating / ratStat.count) : 1500;
				const popularityScore = Math.round(
					selStat.count * 2 + ratStat.wins * 1.5 + (avgRating - 1500) * 0.5,
				);

				return {
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					name_id: name.id,
					name: name.name,
					description: name.description,
					category: name.categories?.[0] || null,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					times_selected: selStat.count,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					avg_rating: avgRating,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					popularity_score: popularityScore,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					created_at: name.created_at || null,
				};
			});

			const sorted = analytics.sort((a, b) => b.popularity_score - a.popularity_score);
			return limit ? sorted.slice(0, limit) : sorted;
		} catch {
			return [];
		}
	},

	/**
	 * Get ranking history for bump chart
	 */
	async getRankingHistory(
		topN = 10,
		periods = 7,
		options: { periods?: number; dateFilter?: string } = {},
	): Promise<{
		data: Array<{
			id: string;
			name: string;
			rankings: (number | null)[];
			avgRating: number;
			totalSelections: number;
		}>;
		timeLabels: string[];
	}> {
		try {
			if (!(await isSupabaseAvailable())) {
				return { data: [], timeLabels: [] };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { data: [], timeLabels: [] };
			}

			const dateFilterPeriods = {
				today: 2,
				week: 7,
				month: 30,
				year: 365,
				all: periods,
			};
			const dateFilterKey = options?.dateFilter as keyof typeof dateFilterPeriods;
			const requestedPeriods =
				options?.periods ??
				(dateFilterKey ? dateFilterPeriods[dateFilterKey] : undefined) ??
				periods;
			const periodCount = Math.max(requestedPeriods, 2);

			const startDate = new Date();
			startDate.setDate(startDate.getDate() - (periodCount - 1));

			const { data: selections, error: selError } = await client
				.from("tournament_selections")
				.select("name_id, name, selected_at")
				.gte("selected_at", startDate.toISOString())
				.order("selected_at", { ascending: true });

			if (selError) {
				console.error("Error fetching selection history:", selError);
				return { data: [], timeLabels: [] };
			}

			const { data: ratings } = await client
				.from("cat_name_ratings")
				.select("name_id, rating, wins");

			const ratingMap = new Map<string, RatingInfo>();
			(ratings || []).forEach((r: any) => {
				// Use any to simplify for now, match database result
				const nameId = String(r.name_id);
				const existing = ratingMap.get(nameId);
				if (!existing || (r.rating && r.rating > existing.rating)) {
					ratingMap.set(nameId, {
						rating: r.rating || 1500,
						wins: r.wins || 0,
					});
				}
			});

			const dateGroups = new Map<string, Map<string, { name: string; count: number }>>();
			const nameData = new Map<
				string,
				{ id: string; name: string; avgRating: number; totalSelections: number }
			>();

			(selections || []).forEach((item) => {
				const s = item as unknown as SelectionRow;
				const nameId = String(s.name_id);
				const dateStr = new Date(s.selected_at).toISOString();
				const [date] = dateStr.split("T");
				if (!date || !dateGroups.has(date)) {
					dateGroups.set(date || "unknown", new Map());
				}
				const dayMap = dateGroups.get(date || "unknown");
				if (!dayMap) {
					return;
				}
				if (!dayMap.has(nameId)) {
					dayMap.set(nameId, { name: s.name, count: 0 });
				}
				const dayData = dayMap.get(nameId);
				if (dayData) {
					dayData.count += 1;
				}

				if (!nameData.has(nameId)) {
					const ratingInfo = ratingMap.get(nameId) || {
						rating: 1500,
						wins: 0,
					};
					nameData.set(nameId, {
						id: nameId,
						name: s.name,
						avgRating: ratingInfo.rating,
						totalSelections: 0,
					});
				}
				const ns = nameData.get(nameId);
				if (ns) {
					ns.totalSelections += 1;
				}
			});

			const timeLabels: string[] = [];
			const today = new Date();
			for (let i = periodCount - 1; i >= 0; i--) {
				const d = new Date(today);
				d.setDate(d.getDate() - i);
				timeLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
			}

			const dateKeys: string[] = [];
			for (let i = periodCount - 1; i >= 0; i--) {
				const d = new Date(today);
				d.setDate(d.getDate() - i);
				dateKeys.push(d.toISOString().split("T")[0] || "");
			}

			const sortedNames = Array.from(nameData.values())
				.sort((a, b) => b.totalSelections - a.totalSelections)
				.slice(0, topN);

			const rankingData = sortedNames.map((nameInfo) => {
				const rankings = dateKeys.map((dateKey) => {
					const dayData = dateGroups.get(dateKey);
					if (!dayData) {
						return null;
					}
					const dayEntries = Array.from(dayData.entries()).sort((a, b) => b[1].count - a[1].count);
					const rankIndex = dayEntries.findIndex(([id]) => id === nameInfo.id);
					return rankIndex >= 0 ? rankIndex + 1 : null;
				});

				return {
					id: nameInfo.id,
					name: nameInfo.name,
					rankings,
					avgRating: nameInfo.avgRating,
					totalSelections: nameInfo.totalSelections,
				};
			});

			return { data: rankingData, timeLabels };
		} catch (error) {
			if (isDev) {
				console.error("Error fetching ranking history:", error);
			}
			return { data: [], timeLabels: [] };
		}
	},
};

export const leaderboardAPI = {
	/**
	 * Get leaderboard data
	 */
	async getLeaderboard(limit: number | null = 50, categoryId: string | null = null) {
		try {
			if (!(await isSupabaseAvailable())) return [];
			const client = await resolveSupabaseClient();
			if (!client) return [];

			if (categoryId) {
				const { data: topNames, error } = await client.rpc("get_top_names_by_category", {
					// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
					p_category: categoryId,
					// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
					p_limit: limit ?? undefined,
				});
				if (error) return [];
				return (topNames || []).map((t: any) => ({ ...t, name_id: t.id }));
			}

			const { data: ratings } = await client
				.from("cat_name_ratings")
				.select("name_id, rating, wins, losses");
			const nameStats = new Map<string | number, NameStats>();
			(ratings || []).forEach((r) => {
				if (!nameStats.has(r.name_id))
					nameStats.set(r.name_id, { totalRating: 0, count: 0, totalWins: 0, totalLosses: 0 });
				const stats = nameStats.get(r.name_id);
				if (stats) {
					stats.totalRating += Number(r.rating) || 1500;
					stats.count += 1;
					stats.totalWins += r.wins || 0;
					stats.totalLosses += r.losses || 0;
				}
			});

			const { data: names } = await client
				.from("cat_name_options")
				.select("id, name, description, avg_rating, categories, created_at")
				.eq("is_active", true)
				.eq("is_hidden", false)
				.order("avg_rating", { ascending: false })
				.limit(limit ? limit * 2 : 100);

			const leaderboard = (names || [])
				.map((row) => {
					const stats = nameStats.get(row.id);
					const avgRating = stats
						? Math.round(stats.totalRating / stats.count)
						: row.avg_rating || 1500;
					return {
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						name_id: row.id,
						name: row.name,
						description: row.description,
						category: row.categories?.[0] || null,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						avg_rating: avgRating,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						total_ratings: stats?.count || 0,
						wins: stats?.totalWins || 0,
						losses: stats?.totalLosses || 0,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						created_at: row.created_at || null,
					};
				})
				.filter((row) => row.total_ratings > 0 || row.avg_rating > 1500)
				.sort((a, b) => b.avg_rating - a.avg_rating);

			return limit ? leaderboard.slice(0, limit) : leaderboard;
		} catch {
			return [];
		}
	},
};

export const statsAPI = {
	/**
	 * Get global site statistics
	 */
	async getSiteStats() {
		try {
			const client = await resolveSupabaseClient();
			if (!client) return null;

			const [namesResult, hiddenResult, usersResult, ratingsResult, selectionsResult] =
				await Promise.all([
					client
						.from("cat_name_options")
						.select("id", { count: "exact", head: true })
						.eq("is_active", true),
					client
						.from("cat_name_options")
						.select("id", { count: "exact", head: true })
						.eq("is_hidden", true),
					client.from("cat_app_users").select("user_name", { count: "exact", head: true }),
					client.from("cat_name_ratings").select("rating"),
					client.from("tournament_selections").select("id", { count: "exact", head: true }),
				]);

			const totalNames = namesResult.count || 0;
			const ratings = ratingsResult.data || [];
			const avgRating =
				ratings.length > 0
					? Math.round(ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length)
					: 1500;

			return {
				totalNames,
				hiddenNames: hiddenResult.count || 0,
				activeNames: totalNames - (hiddenResult.count || 0),
				totalUsers: usersResult.count || 0,
				totalRatings: ratings.length,
				totalSelections: selectionsResult.count || 0,
				avgRating,
			};
		} catch {
			return null;
		}
	},

	/**
	 * Get all names with user-specific ratings
	 */
	async getNamesWithUserRatings(userName: string) {
		try {
			if (!(await isSupabaseAvailable())) return [];
			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client
				.from("cat_name_options")
				.select("*, cat_name_ratings!left (*)")
				.eq("is_active", true)
				.eq("cat_name_ratings.user_name", userName);
			if (error) return [];

			return (data || []).map((item: any) => {
				const ratings = item.cat_name_ratings;
				const userRating = Array.isArray(ratings) ? ratings[0] : ratings;
				return {
					...item,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					user_rating: userRating?.rating || null,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					user_wins: userRating?.wins || 0,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					user_losses: userRating?.losses || 0,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					has_user_rating: !!userRating,
					isHidden: item.is_hidden || false,
				};
			});
		} catch {
			return [];
		}
	},

	/**
	 * Get comprehensive user statistics
	 */
	async getUserStats(userName: string) {
		try {
			if (!(await isSupabaseAvailable())) return null;
			const client = await resolveSupabaseClient();
			if (!client) return null;

			const [ratingsResult, selectionsResult] = await Promise.all([
				client.from("cat_name_ratings").select("*").eq("user_name", userName),
				client.from("tournament_selections").select("*").eq("user_name", userName),
			]);

			const ratings = ratingsResult.data || [];
			const selections = selectionsResult.data || [];
			const totalWins = ratings.reduce((sum, r) => sum + (r.wins || 0), 0);
			const totalLosses = ratings.reduce((sum, r) => sum + (r.losses || 0), 0);

			return {
				userName,
				totalRatings: ratings.length,
				totalSelections: selections.length,
				totalWins,
				totalLosses,
				winRate:
					totalWins + totalLosses > 0
						? Math.round((totalWins / (totalWins + totalLosses)) * 100)
						: 0,
				avgUserRating:
					ratings.length > 0
						? Math.round(ratings.reduce((sum, r) => sum + (r.rating || 1500), 0) / ratings.length)
						: 1500,
			};
		} catch {
			return null;
		}
	},
};

// Barrel export for backward compatibility
export const catNamesAPI = {
	...coreAPI,
	...analyticsAPI,
	...leaderboardAPI,
	...statsAPI,
};
