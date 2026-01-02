import { isDev, isSupabaseAvailable, resolveSupabaseClient } from "../client";

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
			if (!(await isSupabaseAvailable()))
				return { success: false, error: "Supabase not configured" };

			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			await (client.rpc as any)("create_user_account", {
				p_user_name: userName,
			});

			return {
				id: crypto.randomUUID(),
				user_name: userName,
				tournament_name: tournamentName,
				participant_names: participantNames,
				status: "in_progress",
				created_at: new Date().toISOString(),
			};
		} catch (error) {
			if (isDev) console.error("Error creating tournament:", error);
			throw error;
		}
	},

	/**
	 * Update tournament status
	 */
	async updateTournamentStatus(tournamentId: string, status: string) {
		try {
			if (!(await isSupabaseAvailable()))
				return { success: false, error: "Supabase not configured" };

			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			const { data: selections, error: fetchError } = await client
				.from("tournament_selections")
				.select("user_name")
				.eq("tournament_id", tournamentId)
				.limit(1);

			if (fetchError)
				return { success: false, error: "Failed to fetch tournament data" };
			if (!selections || selections.length === 0)
				return { success: false, error: "Tournament not found" };

			return {
				success: true,
				tournamentId,
				status,
				updatedUser: selections[0].user_name,
				message: `Tournament status updated to ${status} (in-memory only)`,
			};
		} catch (error) {
			if (isDev) console.error("Error updating tournament status:", error);
			return {
				success: false,
				error: (error as any).message || "Unknown error occurred",
			};
		}
	},

	/**
	 * Get user tournaments
	 */
	async getUserTournaments(userName: string, _status: string | null = null) {
		try {
			if (!(await isSupabaseAvailable())) return [];

			const client = await resolveSupabaseClient();
			if (!client) return [];

			const { data, error } = await client
				.from("tournament_selections")
				.select(
					"id, user_name, name_id, name, tournament_id, selected_at, selection_type, created_at",
				)
				.eq("user_name", userName)
				.order("created_at", { ascending: false });

			if (error) {
				if (error.code === "42P01") return [];
				throw error;
			}

			const tournamentMap = new Map<string, any>();
			(data || []).forEach((row) => {
				if (!tournamentMap.has(row.tournament_id)) {
					tournamentMap.set(row.tournament_id, {
						id: row.tournament_id,
						user_name: row.user_name,
						tournament_name: `Tournament ${row.tournament_id.slice(0, 8)}`,
						selected_names: [],
						participant_names: [],
						status: "completed",
						created_at: row.created_at,
						completed_at: row.selected_at,
					});
				}
				const tournament = tournamentMap.get(row.tournament_id);
				tournament.selected_names.push(row.name);
				tournament.participant_names.push({ id: row.name_id, name: row.name });
			});

			return Array.from(tournamentMap.values());
		} catch (error) {
			if (isDev) console.error("Error fetching tournaments:", error);
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
			if (!(await isSupabaseAvailable()))
				return { success: false, error: "Supabase not configured" };

			const client = await resolveSupabaseClient();
			if (!client) return { success: false, error: "Supabase not configured" };

			await client.rpc("set_user_context", { user_name_param: userName });

			const finalTournamentId = tournamentId || crypto.randomUUID();
			const now = new Date().toISOString();

			const selectionRecords = selectedNames.map((nameObj) => ({
				user_name: userName,
				name_id: String(nameObj.id),
				name: nameObj.name,
				tournament_id: finalTournamentId,
				selected_at: now,
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
			if (isDev) console.error("Error saving tournament selections:", error);
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
			if (!(await isSupabaseAvailable()))
				return { success: false, error: "Supabase not configured" };
			if (!userName || !ratings || ratings.length === 0)
				return { success: false, error: "Missing userName or ratings" };

			const client = await resolveSupabaseClient();
			if (!client)
				return { success: false, error: "Supabase client unavailable" };

			try {
				await (client.rpc as any)("create_user_account", {
					p_user_name: userName,
				});
			} catch (rpcError) {
				if (isDev)
					console.log(
						"User account check:",
						(rpcError as any).message || "exists",
					);
			}

			try {
				await client.rpc("set_user_context", { user_name_param: userName });
			} catch (rpcError) {
				if (isDev)
					console.warn("Failed to set user context for RLS:", rpcError);
			}

			const nameStrings = ratings.map((r) => r.name);
			const { data: nameData, error: nameError } = await client
				.from("cat_name_options")
				.select("id, name")
				.in("name", nameStrings);

			if (nameError)
				return { success: false, error: "Failed to fetch name IDs" };

			const nameToId = new Map<string, any>(
				nameData.map((n) => [n.name, n.id]),
			);
			const now = new Date().toISOString();
			const ratingRecords = ratings
				.filter((r) => nameToId.has(r.name))
				.map((r) => ({
					user_name: userName,
					name_id: String(nameToId.get(r.name)),
					rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
					wins: r.wins || 0,
					losses: r.losses || 0,
					updated_at: now,
				}));

			if (ratingRecords.length === 0)
				return { success: false, error: "No valid ratings to save" };

			const { error: upsertError } = await client
				.from("cat_name_ratings")
				.upsert(ratingRecords, {
					onConflict: "user_name,name_id",
					ignoreDuplicates: false,
				});

			if (upsertError) return { success: false, error: upsertError.message };

			for (const record of ratingRecords) {
				const { data: avgData } = await client
					.from("cat_name_ratings")
					.select("rating")
					.eq("name_id", record.name_id);
				if (avgData && avgData.length > 0) {
					const avgRating =
						avgData.reduce((sum, r) => sum + Number(r.rating), 0) /
						avgData.length;
					await client
						.from("cat_name_options")
						.update({ avg_rating: Math.round(avgRating) })
						.eq("id", record.name_id);
				}
			}

			return {
				success: true,
				savedCount: ratingRecords.length,
				ratings: ratingRecords,
			};
		} catch (error) {
			if (isDev) console.error("Error saving tournament ratings:", error);
			return { success: false, error: (error as any).message || String(error) };
		}
	},
};

export const deleteName = async (nameId: string | number) => {
	try {
		if (!(await isSupabaseAvailable()))
			return { success: false, error: "Supabase not configured" };

		const client = await resolveSupabaseClient();
		if (!client) return { success: false, error: "Supabase not configured" };

		const { data: nameData, error: nameError } = await client
			.from("cat_name_options")
			.select("name")
			.eq("id", String(nameId))
			.single();

		if (nameError?.code === "PGRST116")
			throw new Error("Name has already been deleted");
		else if (nameError) throw nameError;

		const { error: deleteError } = await client
			.from("cat_name_options")
			.delete()
			.eq("id", String(nameId));

		if (deleteError) {
			if (deleteError.code === "23503") {
				const { error: updateError } = await client
					.from("cat_name_options")
					.update({ is_active: false })
					.eq("id", String(nameId));
				if (updateError) throw updateError;
				return {
					success: true,
					message: "Name deactivated (has related data)",
				};
			}
			throw deleteError;
		}

		return { success: true };
	} catch (error) {
		if (isDev) console.error("Error deleting name:", error);
		return { success: false, error: (error as any).message || String(error) };
	}
};
