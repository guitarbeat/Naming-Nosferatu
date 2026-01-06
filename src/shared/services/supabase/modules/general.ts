import { isDev, isSupabaseAvailable, resolveSupabaseClient } from "../client";

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

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
interface TournamentDisplayData {
	id: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	user_name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	tournament_name: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	selected_names: string[];
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	participant_names: Array<{ id: string | number; name: string }>;
	status: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	created_at: string;
	// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
	completed_at: string;
}

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
		try {
			if (!(await isSupabaseAvailable())) {
				return [];
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return [];
			}

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
		} catch (error) {
			console.error("Unexpected error fetching user list for admin:", error);
			return [];
		}
	},
};

export const imagesAPI = {
	/**
	 * List images from the `cat-images` bucket.
	 */
	async list(prefix = "", limit = 1000) {
		try {
			if (!(await isSupabaseAvailable())) {
				return [];
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return [];
			}

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
				if (n.endsWith(".avif")) {
					return 1;
				}
				if (n.endsWith(".webp")) {
					return 2;
				}
				if (n.endsWith(".jpg") || n.endsWith(".jpeg")) {
					return 3;
				}
				if (n.endsWith(".png")) {
					return 4;
				}
				if (n.endsWith(".gif")) {
					return 5;
				}
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
		} catch (e) {
			if (isDev) {
				console.error("imagesAPI.list fatal:", e);
			}
			return [];
		}
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
		try {
			const client = await resolveSupabaseClient();
			if (!client) {
				return null;
			}

			const { data, error } = await client
				.from("site_settings")
				.select("value")
				.eq("key", "cat_chosen_name")
				.maybeSingle();

			if (error) {
				return null;
			}
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

export const tournamentsAPI = {
	/**
	 * Create a new tournament
	 */
	async createTournament(
		userName: string,
		tournamentName: string,
		participantNames: Array<{ id: string | number; name: string }>,
		_tournamentData: Record<string, unknown> = {},
	) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase not configured" };
			}

			// biome-ignore lint/suspicious/noExplicitAny: RPC requires dynamic dispatch for custom functions
			await (client as any).rpc("create_user_account", {
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				p_user_name: userName,
			});

			return {
				id: crypto.randomUUID(),
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				user_name: userName,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				tournament_name: tournamentName,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				participant_names: participantNames,
				status: "in_progress",
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				created_at: new Date().toISOString(),
			};
		} catch (error) {
			if (isDev) {
				console.error("Error creating tournament:", error);
			}
			throw error;
		}
	},

	/**
	 * Update tournament status
	 */
	async updateTournamentStatus(tournamentId: string, status: string) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase not configured" };
			}

			const { data: selections, error: fetchError } = await client
				.from("tournament_selections")
				.select("user_name")
				.eq("tournament_id", tournamentId)
				.limit(1);

			if (fetchError) {
				return { success: false, error: "Failed to fetch tournament data" };
			}
			if (!selections || selections.length === 0) {
				return { success: false, error: "Tournament not found" };
			}

			return {
				success: true,
				tournamentId,
				status,
				updatedUser: selections[0].user_name,
				message: `Tournament status updated to ${status} (in-memory only)`,
			};
		} catch (error) {
			if (isDev) {
				console.error("Error updating tournament status:", error);
			}
			return {
				success: false,
				error: (error as Error).message || "Unknown error occurred",
			};
		}
	},

	/**
	 * Get user tournaments
	 */
	async getUserTournaments(userName: string, _status: string | null = null) {
		try {
			if (!(await isSupabaseAvailable())) {
				return [];
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return [];
			}

			const { data, error } = await client
				.from("tournament_selections")
				.select(
					"id, user_name, name_id, name, tournament_id, selected_at, selection_type, created_at",
				)
				.eq("user_name", userName)
				.order("created_at", { ascending: false });

			if (error) {
				if (error.code === "42P01") {
					return [];
				}
				throw error;
			}

			const tournamentMap = new Map<string, TournamentDisplayData>();
			(data || []).forEach((row) => {
				if (!tournamentMap.has(row.tournament_id)) {
					tournamentMap.set(row.tournament_id, {
						id: row.tournament_id,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						user_name: row.user_name,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						tournament_name: `Tournament ${row.tournament_id.slice(0, 8)}`,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						selected_names: [],
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						participant_names: [],
						status: "completed",
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						created_at: row.created_at,
						// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
						completed_at: row.selected_at,
					});
				}
				const tournament = tournamentMap.get(row.tournament_id);
				if (tournament) {
					tournament.selected_names.push(row.name);
					tournament.participant_names.push({
						id: row.name_id,
						name: row.name,
					});
				}
			});

			return Array.from(tournamentMap.values());
		} catch (error) {
			if (isDev) {
				console.error("Error fetching tournaments:", error);
			}
			return [];
		}
	},

	/**
	 * Save tournament selections
	 */
	async saveTournamentSelections(
		userName: string,
		selectedNames: Array<{ id: string | number; name: string }>,
		tournamentId: string | null = null,
	) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase not configured" };
			}

			await client.rpc("set_user_context", {
				// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
				user_name_param: userName,
			});

			const finalTournamentId = tournamentId || crypto.randomUUID();
			const now = new Date().toISOString();

			const selectionRecords = selectedNames.map((nameObj) => ({
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				user_name: userName,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				name_id: String(nameObj.id),
				name: nameObj.name,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				tournament_id: finalTournamentId,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				selected_at: now,
				// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
				selection_type: "tournament_setup",
			}));

			const { error: insertError } = await client
				.from("tournament_selections")
				.insert(selectionRecords);

			if (insertError) {
				console.error("Error inserting tournament selections:", insertError);
				return {
					success: false,
					error: "Failed to save tournament selections",
				};
			}

			return {
				success: true,
				finalTournamentId,
				selectionCount: selectedNames.length,
				selectedNames: selectedNames.map((n) => n.name),
				method: "tournament_selections_table",
			};
		} catch (error) {
			if (isDev) {
				console.error("Error saving tournament selections:", error);
			}
			throw error;
		}
	},

	/**
	 * Save tournament ratings
	 */
	async saveTournamentRatings(
		userName: string,
		ratings: Array<{
			name: string;
			rating: number;
			wins?: number;
			losses?: number;
		}>,
	) {
		try {
			if (!(await isSupabaseAvailable())) {
				return { success: false, error: "Supabase not configured" };
			}
			if (!userName || !ratings || ratings.length === 0) {
				return { success: false, error: "Missing userName or ratings" };
			}

			const client = await resolveSupabaseClient();
			if (!client) {
				return { success: false, error: "Supabase client unavailable" };
			}

			try {
				// biome-ignore lint/suspicious/noExplicitAny: RPC requires dynamic dispatch for custom functions
				await (client as any).rpc("create_user_account", {
					// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
					p_user_name: userName,
				});
			} catch (rpcError) {
				if (isDev) {
					console.log("User account check:", (rpcError as Error).message || "exists");
				}
			}

			try {
				await client.rpc("set_user_context", {
					// biome-ignore lint/style/useNamingConvention: RPC parameter must match database function signature
					user_name_param: userName,
				});
			} catch (rpcError) {
				if (isDev) {
					console.warn("Failed to set user context for RLS:", rpcError);
				}
			}

			const nameStrings = ratings.map((r) => r.name);
			const { data: nameData, error: nameError } = await client
				.from("cat_name_options")
				.select("id, name")
				.in("name", nameStrings);

			if (nameError) {
				return { success: false, error: "Failed to fetch name IDs" };
			}

			const nameToId = new Map<string, string | number>(nameData.map((n) => [n.name, n.id]));
			const now = new Date().toISOString();
			const ratingRecords = ratings
				.filter((r) => nameToId.has(r.name))
				.map((r) => ({
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					user_name: userName,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					name_id: String(nameToId.get(r.name)),
					rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
					wins: r.wins || 0,
					losses: r.losses || 0,
					// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
					updated_at: now,
				}));

			if (ratingRecords.length === 0) {
				return { success: false, error: "No valid ratings to save" };
			}

			const { error: upsertError } = await client.from("cat_name_ratings").upsert(ratingRecords, {
				onConflict: "user_name,name_id",
				ignoreDuplicates: false,
			});

			if (upsertError) {
				return { success: false, error: upsertError.message };
			}

			for (const record of ratingRecords) {
				const { data: avgData } = await client
					.from("cat_name_ratings")
					.select("rating")
					.eq("name_id", record.name_id);
				if (avgData && avgData.length > 0) {
					const avgRating = avgData.reduce((sum, r) => sum + Number(r.rating), 0) / avgData.length;
					await client
						.from("cat_name_options")
						.update({
							// biome-ignore lint/style/useNamingConvention: Database column names must match exactly
							avg_rating: Math.round(avgRating),
						})
						.eq("id", record.name_id);
				}
			}

			return {
				success: true,
				savedCount: ratingRecords.length,
				ratings: ratingRecords,
			};
		} catch (error) {
			if (isDev) {
				console.error("Error saving tournament ratings:", error);
			}
			return {
				success: false,
				error: (error as Error).message || String(error),
			};
		}
	},
};

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
