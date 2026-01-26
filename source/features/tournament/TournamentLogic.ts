import { queryClient, withSupabase } from "@supabase/client";
import { ELO_RATING, STORAGE_KEYS } from "@/constants";
import type { NameItem } from "@/types";

/* =========================================================================
   SERVICE
   ========================================================================= */

export const tournamentsAPI = {
	async createTournament(
		userName: string,
		tournamentName: string,
		participantNames: NameItem[],
	): Promise<
		| {
				success: true;
				data: {
					id: string;
					user_name: string;
					tournament_name: string;
					participant_names: NameItem[];
					status: string;
					created_at: string;
				};
				error?: undefined;
		  }
		| { success: false; error: string; data?: undefined }
	> {
		type ResultType =
			| {
					success: true;
					data: {
						id: string;
						user_name: string;
						tournament_name: string;
						participant_names: NameItem[];
						status: string;
						created_at: string;
					};
					error?: undefined;
			  }
			| { success: false; error: string; data?: undefined };
		return withSupabase<ResultType>(
			async (client) => {
				// biome-ignore lint/suspicious/noExplicitAny: RPC call requires dynamic access to client
				await (client as any).rpc("create_user_account", {
					p_user_name: userName,
				});
				return {
					success: true as const,
					data: {
						id: crypto.randomUUID(),
						user_name: userName,
						tournament_name: tournamentName,
						participant_names: participantNames,
						status: "in_progress",
						created_at: new Date().toISOString(),
					},
				};
			},
			{ success: false as const, error: "Supabase not configured" },
		);
	},
	async saveTournamentRatings(
		userName: string,
		ratings: { name: string; rating: number; wins?: number; losses?: number }[],
		skipQueue = false,
	) {
		// * Offline Handling
		if (!skipQueue && typeof navigator !== "undefined" && !navigator.onLine) {
			const { syncQueue } = await import("@services/SyncQueue");
			syncQueue.enqueue("SAVE_RATINGS", { userName, ratings });
			const { devLog } = await import("@utils");
			devLog("[TournamentLogic] Offline: Queued ratings save");
			return { success: true, savedCount: ratings.length, offline: true };
		}

		return withSupabase(
			async (client) => {
				if (!userName || !ratings?.length) {
					return { success: false, error: "Missing data" };
				}
				const nameStrings = ratings.map((r) => r.name);
				const { data: nameData } = await client
					.from("cat_name_options")
					.select("id, name")
					.in("name", nameStrings);
				const nameToId = new Map(nameData?.map((n) => [n.name, n.id]) || []);
				const ratingRecords = ratings
					.filter((r) => nameToId.has(r.name))
					.map((r) => ({
						user_name: userName,
						name_id: String(nameToId.get(r.name)),
						rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
						wins: r.wins || 0,
						losses: r.losses || 0,
						updated_at: new Date().toISOString(),
					}));
				if (!ratingRecords.length) {
					return { success: false, error: "No valid ratings" };
				}
				const { error } = await client
					.from("cat_name_ratings")
					.upsert(ratingRecords, { onConflict: "user_name,name_id" });
				return { success: !error, savedCount: ratingRecords.length };
			},
			{ success: false, error: "Supabase offline" },
		);
	},
};

/* =========================================================================
   ELO RATING
   ========================================================================= */

export class EloRating {
	constructor(
		public defaultRating = ELO_RATING.DEFAULT_RATING,
		public kFactor = ELO_RATING.DEFAULT_K_FACTOR,
	) {}
	getExpectedScore(ra: number, rb: number) {
		return 1 / (1 + 10 ** ((rb - ra) / ELO_RATING.RATING_DIVISOR));
	}
	updateRating(r: number, exp: number, act: number, games = 0) {
		const k = games < ELO_RATING.NEW_PLAYER_GAME_THRESHOLD ? this.kFactor * 2 : this.kFactor;
		return Math.round(r + k * (act - exp));
	}
	calculateNewRatings(
		ra: number,
		rb: number,
		outcome: string,
		stats?: { winsA: number; lossesA: number; winsB: number; lossesB: number },
	) {
		const expA = this.getExpectedScore(ra, rb);
		const expB = this.getExpectedScore(rb, ra);
		const actA = outcome === "left" ? 1 : outcome === "right" ? 0 : 0.5;
		const actB = outcome === "right" ? 1 : outcome === "left" ? 0 : 0.5;

		const winsA = (stats?.winsA || 0) + (actA === 1 ? 1 : 0);
		const lossesA = (stats?.lossesA || 0) + (actA === 0 ? 1 : 0);
		const winsB = (stats?.winsB || 0) + (actB === 1 ? 1 : 0);
		const lossesB = (stats?.lossesB || 0) + (actB === 0 ? 1 : 0);

		return {
			newRatingA: this.updateRating(ra, expA, actA),
			newRatingB: this.updateRating(rb, expB, actB),
			winsA,
			lossesA,
			winsB,
			lossesB,
		};
	}
}

/* =========================================================================
   PREFERENCE SORTER
   ========================================================================= */

export class PreferenceSorter {
	preferences = new Map<string, number>();
	currentIndex = 0;
	lastMatch: string | null = null;

	// Total possible pairs is N * (N - 1) / 2
	// We no longer store the `pairs` array to save memory (O(N^2) -> O(1))
	constructor(public items: string[]) {}

	/**
	 * Calculates the pair indices (i, j) corresponding to the linear index k.
	 * This avoids generating the O(N^2) pairs array.
	 */
	private getIndicesFromIndex(index: number, n: number) {
		let current = index;
		// Iterate through rows (i)
		for (let i = 0; i < n - 1; i++) {
			const pairsInRow = n - 1 - i;
			if (current < pairsInRow) {
				return { i, j: i + 1 + current };
			}
			current -= pairsInRow;
		}
		return null; // Index out of bounds
	}

	addPreference(a: string, b: string, val: number) {
		this.preferences.set(`${a}-${b}`, val);
		this.lastMatch = `${a}-${b}`;
	}

	undoLastPreference() {
		if (this.lastMatch && this.preferences.has(this.lastMatch)) {
			this.preferences.delete(this.lastMatch);
			this.lastMatch = null;
			this.currentIndex = Math.max(0, this.currentIndex - 1);
		}
	}

	getNextMatch() {
		// Calculate total pairs: N * (N - 1) / 2
		const n = this.items.length;
		const totalPairs = (n * (n - 1)) / 2;

		if (n < 2) {
			return null;
		}

		// We can optimize this loop by keeping track of i, j statefuly if needed,
		// but since we usually just step forward, recalculating from currentIndex is fine
		// unless currentIndex is very large, but the inner calculation is O(N) max.
		// For N=1000, calculating indices is cheap.

		// However, to iterate efficiently from currentIndex forward:
		// We calculate initial (i, j) for currentIndex
		const indices = this.getIndicesFromIndex(this.currentIndex, n);
		if (!indices) {
			return null;
		}

		let { i, j } = indices;

		while (this.currentIndex < totalPairs) {
			const a = this.items[i];
			const b = this.items[j];

			if (a && b) {
				if (!this.preferences.has(`${a}-${b}`) && !this.preferences.has(`${b}-${a}`)) {
					return { left: a, right: b };
				}
			}

			// Advance to next pair
			this.currentIndex++;
			j++;
			if (j >= n) {
				i++;
				j = i + 1;
			}
		}
		return null;
	}
}

/* =========================================================================
   GENERAL UTILS
   ========================================================================= */

/**
 * Calculate bracket round based on number of names and current match
 */
export function calculateBracketRound(totalNames: number, currentMatch: number): number {
	if (totalNames <= 2) {
		return 1;
	}
	const matchesPerRound = Math.ceil(totalNames / 2);
	return Math.ceil(currentMatch / matchesPerRound);
}

/**
 * Computes a new rating based on a weighted blend of existing rating and new position rating.
 * The blend factor is determined by the number of matches played relative to the maximum expected matches.
 *
 * @param matchesPlayed - Number of matches played so far
 * @param maxMatches - Maximum expected matches for the tournament/session
 * @param newPositionRating - The rating derived from the current position/rank
 * @param existingRating - The user's existing rating
 * @returns The new calculated rating, clamped between 1000 and 2000
 */
export function computeRating(
	matchesPlayed: number,
	maxMatches: number,
	newPositionRating: number,
	existingRating: number,
): number {
	const safeMaxMatches = Math.max(1, maxMatches);

	// Clamp matchesPlayed to maxMatches to prevent potential logical inconsistencies
	// where the blend factor might be calculated based on an impossible number of matches.
	// Although the blendFactor is capped at 0.8, this ensures the ratio never exceeds 1.0.
	const clampedMatches = Math.min(matchesPlayed, safeMaxMatches);

	const blendFactor = Math.min(0.8, (clampedMatches / safeMaxMatches) * 0.9);

	const newRating = Math.round(
		blendFactor * newPositionRating + (1 - blendFactor) * existingRating,
	);

	return Math.max(1000, Math.min(2000, newRating));
}

/**
 * Clear tournament-related query cache
 */
export function clearTournamentCache() {
	try {
		queryClient.removeQueries({ queryKey: ["tournament"] });
		queryClient.removeQueries({ queryKey: ["catNames"] });
		return true;
	} catch (error) {
		console.error("Error clearing tournament cache:", error);
		return false;
	}
}

/**
 * Exports tournament results to a CSV file.
 *
 * @param rankings Array of NameItems with rankings
 * @param filename Optional filename (default: generated based on date)
 */
export const exportTournamentResultsToCSV = (rankings: NameItem[], filename?: string): void => {
	if (!rankings.length) {
		return;
	}

	const headers = ["Name", "Rating", "Wins", "Losses"];
	const rows = rankings.map((r) =>
		[`"${r.name}"`, Math.round(Number(r.rating || 1500)), r.wins || 0, r.losses || 0].join(","),
	);

	const csvContent = [headers.join(","), ...rows].join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");

	const downloadName = filename || `cat_names_${new Date().toISOString().slice(0, 10)}.csv`;

	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", downloadName);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
};
