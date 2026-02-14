import { withSupabase } from "@/services/supabase/client";
import type { NameItem } from "@/types/appTypes";
import { devLog } from "@/utils/basic";
import { ELO_RATING } from "@/utils/constants";

const HAS_NAVIGATOR = typeof navigator !== "undefined";

// ═══════════════════════════════════════════════════════════════════════════════
// Offline Sync Queue
// ═══════════════════════════════════════════════════════════════════════════════

interface SyncPayload {
	userName: string;
	ratings: Array<{
		name: string;
		rating: number;
		wins?: number;
		losses?: number;
	}>;
}

export interface SyncItem {
	id: string;
	type: "SAVE_RATINGS";
	payload: SyncPayload;
	timestamp: number;
	retryCount: number;
}

class SyncQueueService {
	private queue: SyncItem[] = [];
	private readonly STORAGE_KEY = "offline_sync_queue";

	constructor() {
		this.load();
	}

	private load() {
		if (!HAS_NAVIGATOR) {
			return;
		}
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				this.queue = JSON.parse(stored);
			}
		} catch {
			/* ignore */
		}
	}

	private save() {
		if (!HAS_NAVIGATOR) {
			return;
		}
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
		} catch {
			/* quota exceeded — item stays in memory only */
		}
	}

	enqueue(type: SyncItem["type"], payload: SyncPayload): void {
		this.queue.push({
			id: globalThis.crypto?.randomUUID?.() ?? `sync_${Date.now()}`,
			type,
			payload,
			timestamp: Date.now(),
			retryCount: 0,
		});
		this.save();
	}

	dequeue(): SyncItem | undefined {
		const item = this.queue.shift();
		this.save();
		return item;
	}

	peek(): SyncItem | undefined {
		return this.queue[0];
	}

	isEmpty(): boolean {
		return this.queue.length === 0;
	}

	getQueue(): readonly SyncItem[] {
		return [...this.queue];
	}

	clear(): void {
		this.queue = [];
		this.save();
	}
}

export const syncQueue = new SyncQueueService();

// ═══════════════════════════════════════════════════════════════════════════════
// Tournament API
// ═══════════════════════════════════════════════════════════════════════════════

const nameToIdCache = new Map<string, string>();

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
		if (!skipQueue && HAS_NAVIGATOR && !navigator.onLine) {
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
				const uniqueNames = [...new Set(ratings.map((r) => r.name))];
				const missingNames = uniqueNames.filter((name) => !nameToIdCache.has(name));

				if (missingNames.length > 0) {
					const { data: nameData } = (await client
						.from("cat_name_options")
						.select("id, name")
						.in("name", missingNames)) as unknown as {
						data: Array<{ id: string | number; name: string }> | null;
						error: unknown;
					};

					if (nameData) {
						for (const n of nameData) {
							nameToIdCache.set(n.name, n.id);
						}
					}
				}

				// Build upsert records (only for names we found in the DB)
				const records = ratings
					.filter((r) => nameToIdCache.has(r.name))
					.map((r) => ({
						user_name: userName,
						name_id: String(nameToIdCache.get(r.name)),
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

// ═══════════════════════════════════════════════════════════════════════════════
// Elo Rating
// ═══════════════════════════════════════════════════════════════════════════════

export type MatchOutcome = "left" | "right" | "tie";

interface MatchStats {
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
}

interface EloResult {
	newRatingA: number;
	newRatingB: number;
	winsA: number;
	lossesA: number;
	winsB: number;
	lossesB: number;
}

/**
 * Elo rating calculator with adaptive K-factor.
 *
 * New players (< `NEW_PLAYER_GAME_THRESHOLD` games) get double K-factor
 * so their rating converges faster.
 *
 * @example
 * const elo = new EloRating();
 * const result = elo.calculateNewRatings(1500, 1500, "left");
 * // result.newRatingA > 1500, result.newRatingB < 1500
 */
export class EloRating {
	constructor(
		public readonly defaultRating = ELO_RATING.DEFAULT_RATING,
		public readonly kFactor = ELO_RATING.DEFAULT_K_FACTOR,
	) {}

	/** Expected score of player A against player B (0–1). */
	getExpectedScore(ratingA: number, ratingB: number): number {
		return 1 / (1 + 10 ** ((ratingB - ratingA) / ELO_RATING.RATING_DIVISOR));
	}

	/** Apply the Elo update formula with adaptive K-factor. */
	updateRating(rating: number, expected: number, actual: number, gameCount = 0): number {
		const k =
			gameCount < ELO_RATING.NEW_PLAYER_GAME_THRESHOLD
				? this.kFactor * ELO_RATING.NEW_PLAYER_K_MULTIPLIER
				: this.kFactor;
		return Math.round(rating + k * (actual - expected));
	}

	/**
	 * Calculate new ratings for both players after a match.
	 *
	 * @param ratingA  - Player A's current rating
	 * @param ratingB  - Player B's current rating
	 * @param outcome  - `"left"` = A wins, `"right"` = B wins, `"tie"` = draw
	 * @param stats    - Optional existing win/loss counts
	 */
	calculateNewRatings(
		ratingA: number,
		ratingB: number,
		outcome: MatchOutcome,
		stats?: Partial<MatchStats>,
	): EloResult {
		const expectedA = this.getExpectedScore(ratingA, ratingB);
		const expectedB = this.getExpectedScore(ratingB, ratingA);

		const actualA = outcome === "left" ? 1 : outcome === "right" ? 0 : 0.5;
		const actualB = 1 - actualA;

		return {
			newRatingA: this.updateRating(ratingA, expectedA, actualA),
			newRatingB: this.updateRating(ratingB, expectedB, actualB),
			winsA: (stats?.winsA ?? 0) + (actualA === 1 ? 1 : 0),
			lossesA: (stats?.lossesA ?? 0) + (actualA === 0 ? 1 : 0),
			winsB: (stats?.winsB ?? 0) + (actualB === 1 ? 1 : 0),
			lossesB: (stats?.lossesB ?? 0) + (actualB === 0 ? 1 : 0),
		};
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// Preference Sorter
// ═══════════════════════════════════════════════════════════════════════════════

interface MatchPair {
	left: string;
	right: string;
}

/**
 * Round-robin pairwise comparison engine.
 *
 * Generates all unique pairs from a set of items, tracks which have
 * been compared, and supports undo.
 *
 * Total comparisons = `n * (n - 1) / 2`.
 *
 * @example
 * const sorter = new PreferenceSorter(["Luna", "Oliver", "Milo"]);
 * const match = sorter.getNextMatch(); // { left: "Luna", right: "Oliver" }
 * sorter.addPreference("Luna", "Oliver", 1);
 * const next = sorter.getNextMatch();  // { left: "Luna", right: "Milo" }
 */
export class PreferenceSorter {
	readonly preferences = new Map<string, number>();
	// Made public for useTournamentState
	public currentIndex = 0;
	private lastMatch: string | null = null;

	constructor(public readonly items: string[]) {}

	/**
	 * Convert a flat pair index into (i, j) indices for a triangular matrix.
	 * Returns null if the index is out of bounds.
	 */
	private pairFromIndex(index: number): { i: number; j: number } | null {
		const n = this.items.length;
		let remaining = index;

		for (let i = 0; i < n - 1; i++) {
			const pairsInRow = n - 1 - i;
			if (remaining < pairsInRow) {
				return { i, j: i + 1 + remaining };
			}
			remaining -= pairsInRow;
		}

		return null;
	}

	/** Record a comparison result between two items. */
	addPreference(a: string, b: string, value: number): void {
		const key = `${a}-${b}`;
		this.preferences.set(key, value);
		this.lastMatch = key;
	}

	/** Undo the most recent comparison. */
	undoLastPreference(): void {
		if (this.lastMatch && this.preferences.has(this.lastMatch)) {
			this.preferences.delete(this.lastMatch);
			this.lastMatch = null;
			this.currentIndex = Math.max(0, this.currentIndex - 1);
		}
	}

	/**
	 * Get the next uncompared pair, or `null` if all pairs are done.
	 */
	getNextMatch(): MatchPair | null {
		const n = this.items.length;
		if (n < 2) {
			return null;
		}

		const totalPairs = (n * (n - 1)) / 2;

		while (this.currentIndex < totalPairs) {
			const pair = this.pairFromIndex(this.currentIndex);
			if (!pair) {
				break;
			}

			const a = this.items[pair.i];
			const b = this.items[pair.j];

			if (a && b) {
				const forward = `${a}-${b}`;
				const reverse = `${b}-${a}`;

				if (!this.preferences.has(forward) && !this.preferences.has(reverse)) {
					return { left: a, right: b };
				}
			}

			this.currentIndex++;
		}

		return null;
	}
}

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

export function invalidateNameCache(name: string) {
	nameToIdCache.delete(name);
}

export function updateNameCache(name: string, id: string | number) {
	nameToIdCache.set(name, id);
}

export function invalidateIdCache(id: string | number) {
	let found = false;
	for (const [name, cachedId] of nameToIdCache.entries()) {
		if (cachedId === id) {
			nameToIdCache.delete(name);
			found = true;
		}
	}
	if (!found) {
		devLog?.(`invalidateIdCache: no cache entry found for id: ${String(id)}`);
	}
}
