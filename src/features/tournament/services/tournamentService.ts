import { withSupabase } from "../../../shared/services/supabase/client";

/**
 * Database query result type - field names match Supabase column names (snake_case required)
 */
export interface TournamentDisplayData {
	id: string;
	user_name: string;
	tournament_name: string;
	selected_names: string[];
	participant_names: Array<{ id: string | number; name: string }>;
	status: string;
	created_at: string;
	completed_at: string;
}

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
		return withSupabase(
			async (client) => {
				// biome-ignore lint/suspicious/noExplicitAny: RPC requires dynamic dispatch for custom functions
				await (client as any).rpc("create_user_account", {
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
			},
			// biome-ignore lint/suspicious/noExplicitAny: Fallback object shape depends on generic T
			{ success: false, error: "Supabase not configured" } as any,
		);
	},

	/**
	 * Update tournament status
	 */
	async updateTournamentStatus(tournamentId: string, status: string) {
		return withSupabase(
			async (client) => {
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
					updatedUser: selections[0]?.user_name,
					message: `Tournament status updated to ${status} (in-memory only)`,
				};
			},
			{ success: false, error: "Supabase not configured" },
		);
	},

	/**
	 * Get user tournaments
	 */
	async getUserTournaments(userName: string, _status: string | null = null) {
		return withSupabase<TournamentDisplayData[]>(async (client) => {
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
				if (tournament) {
					tournament.selected_names.push(row.name);
					tournament.participant_names.push({
						id: row.name_id,
						name: row.name,
					});
				}
			});

			return Array.from(tournamentMap.values());
		}, []);
	},

	/**
	 * Save tournament selections
	 */
	async saveTournamentSelections(
		userName: string,
		selectedNames: Array<{ id: string | number; name: string }>,
		tournamentId: string | null = null,
	) {
		return withSupabase(
			async (client) => {
				await client.rpc("set_user_context", {
					user_name_param: userName,
				});

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
			},
			{ success: false, error: "Supabase not configured" },
		);
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
		return withSupabase(
			async (client) => {
				if (!userName || !ratings || ratings.length === 0) {
					return { success: false, error: "Missing userName or ratings" };
				}

				try {
					// biome-ignore lint/suspicious/noExplicitAny: RPC requires dynamic dispatch for custom functions
					await (client as any).rpc("create_user_account", {
						p_user_name: userName,
					});
				} catch {
					// ignore if already exists
				}

				try {
					await client.rpc("set_user_context", {
						user_name_param: userName,
					});
				} catch {
					// ignore context errors
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
						user_name: userName,
						name_id: String(nameToId.get(r.name)),
						rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
						wins: r.wins || 0,
						losses: r.losses || 0,
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

				// Background update for average ratings
				for (const record of ratingRecords) {
					const { data: avgData } = await client
						.from("cat_name_ratings")
						.select("rating")
						.eq("name_id", record.name_id);
					if (avgData && avgData.length > 0) {
						const avgRating =
							avgData.reduce((sum, r) => sum + Number(r.rating), 0) / avgData.length;
						await client
							.from("cat_name_options")
							.update({
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
			},
			{ success: false, error: "Supabase not configured" },
		);
	},
};
