import { syncQueue } from "@/services/SyncQueue";
import { withSupabase } from "@/services/supabase/client";
import type { NameItem } from "@/shared/types";
import { devLog } from "@/utils/basic";

// ═══════════════════════════════════════════════════════════════════════════════
// Name ID Cache
// ═══════════════════════════════════════════════════════════════════════════════

export const nameToIdCache = new Map<string, string | number>();

export function updateNameCache(name: string, id: string | number) {
	nameToIdCache.set(name, id);
}

export function invalidateNameCache(name?: string) {
	if (name) {
		nameToIdCache.delete(name);
	} else {
		nameToIdCache.clear();
	}
}

export function invalidateIdCache(id: string | number) {
	for (const [key, value] of nameToIdCache.entries()) {
		if (String(value) === String(id)) {
			nameToIdCache.delete(key);
		}
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Offline Sync Queue
// ═══════════════════════════════════════════════════════════════════════════════

// Implementation lives in `src/services/SyncQueue.ts`.

// ═══════════════════════════════════════════════════════════════════════════════
// Tournament API
// ═══════════════════════════════════════════════════════════════════════════════

interface TournamentCreateResult {
	success: boolean;
	data?: {
		id: string;
		user_name: string;
		tournament_name: string;
		participant_names: NameItem[];
		status: string;
		created_at: string;
	};
	error?: string;
}

interface RatingSaveResult {
	success: boolean;
	savedCount?: number;
	offline?: boolean;
	error?: string;
}

/**
 * Tournament persistence layer.
 *
 * @example
 * const result = await tournamentsAPI.saveTournamentRatings(userName, ratings);
 * if (result.offline) showToast("Saved offline — will sync later");
 */
export const tournamentsAPI = {
	/**
	 * Create a tournament session. Creates the user account via RPC if needed.
	 */
	async createTournament(
		userName: string,
		tournamentName: string,
		participantNames: NameItem[],
	): Promise<TournamentCreateResult> {
		return withSupabase<TournamentCreateResult>(
			async (client) => {
				await client.rpc("create_user_account", { p_user_name: userName });
				return {
					success: true,
					data: {
						id: globalThis.crypto?.randomUUID?.() ?? `t_${Date.now()}`,
						user_name: userName,
						tournament_name: tournamentName,
						participant_names: participantNames,
						status: "in_progress",
						created_at: new Date().toISOString(),
					},
				};
			},
			{ success: false, error: "Supabase not configured" },
		);
	},

	/**
	 * Save tournament ratings to the database.
	 * Falls back to offline queue when disconnected.
	 *
	 * @param skipQueue - When `true`, bypasses the offline queue check
	 *   (used when processing the queue itself to prevent recursion).
	 */
	async saveTournamentRatings(
		userName: string,
		ratings: Array<{
			name: string;
			rating: number;
			wins?: number;
			losses?: number;
		}>,
		skipQueue = false,
	): Promise<RatingSaveResult> {
		// Offline: queue for later
		if (!skipQueue && typeof navigator !== "undefined" && !navigator.onLine) {
			syncQueue.enqueue("SAVE_RATINGS", { userName, ratings });
			devLog("[TournamentAPI] Offline: queued ratings save");
			return { success: true, savedCount: ratings.length, offline: true };
		}

		return withSupabase<RatingSaveResult>(
			async (client) => {
				if (!userName || !ratings?.length) {
					return { success: false, error: "Missing data" };
				}

				// Resolve name → ID mapping
				const nameToId = new Map<string, string | number>();
				const missingNames = new Set<string>();

				for (const r of ratings) {
					const cachedId = nameToIdCache.get(r.name);
					if (cachedId !== undefined) {
						nameToId.set(r.name, cachedId);
					} else {
						missingNames.add(r.name);
					}
				}

				if (missingNames.size > 0) {
					const namesToFetch = Array.from(missingNames);
					const { data: nameData } = (await client
						.from("cat_name_options")
						.select("id, name")
						.in("name", namesToFetch)) as unknown as {
						data: Array<{ id: string | number; name: string }> | null;
						error: unknown;
					};

					for (const n of nameData ?? []) {
						nameToIdCache.set(n.name, n.id);
						nameToId.set(n.name, n.id);
					}

					devLog(
						`[TournamentAPI] Resolved ${nameData?.length ?? 0} names from DB, ${
							ratings.length - missingNames.size
						} from cache.`,
					);
				} else {
					devLog(`[TournamentAPI] Resolved all ${ratings.length} names from cache.`);
				}

				// Build upsert records (only for names we found in the DB or Cache)
				const records = ratings
					.filter((r) => nameToId.has(r.name))
					.map((r) => ({
						user_name: userName,
						name_id: String(nameToId.get(r.name)),
						rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
						wins: r.wins ?? 0,
						losses: r.losses ?? 0,
						updated_at: new Date().toISOString(),
					}));

				if (records.length === 0) {
					return { success: false, error: "No valid ratings to save" };
				}

				const { error } = await client
					.from("cat_name_ratings")
					.upsert(records, { onConflict: "user_name,name_id" });

				return { success: !error, savedCount: records.length };
			},
			{ success: false, error: "Supabase offline" },
		);
	},
};

// EloRating consolidated to services/tournament.ts

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Exports
// ═══════════════════════════════════════════════════════════════════════════════

/** Calculate which bracket round a match falls in. */
export function calculateBracketRound(totalNames: number, currentMatch: number): number {
	if (totalNames <= 2) {
		return 1;
	}
	const matchesPerRound = Math.ceil(totalNames / 2);
	return Math.ceil(currentMatch / matchesPerRound);
}
