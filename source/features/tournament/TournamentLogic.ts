import { ELO_RATING } from "../../core/constants";
import { withSupabase } from "../../shared/services/supabase/client";

/* =========================================================================
   SERVICE
   ========================================================================= */

export const tournamentsAPI = {
    async createTournament(userName: string, tournamentName: string, participantNames: any[]) {
        return withSupabase(async (client) => {
            await (client as any).rpc("create_user_account", { p_user_name: userName });
            return { id: crypto.randomUUID(), user_name: userName, tournament_name: tournamentName, participant_names: participantNames, status: "in_progress", created_at: new Date().toISOString() };
        }, { success: false, error: "Supabase not configured" } as any);
    },
    async saveTournamentRatings(userName: string, ratings: any[]) {
        return withSupabase(async (client) => {
            if (!userName || !ratings?.length) return { success: false, error: "Missing data" };
            const nameStrings = ratings.map((r) => r.name);
            const { data: nameData } = await client.from("cat_name_options").select("id, name").in("name", nameStrings);
            const nameToId = new Map(nameData?.map(n => [n.name, n.id]) || []);
            const ratingRecords = ratings.filter(r => nameToId.has(r.name)).map(r => ({
                user_name: userName, name_id: String(nameToId.get(r.name)),
                rating: Math.min(2400, Math.max(800, Math.round(r.rating))),
                wins: r.wins || 0, losses: r.losses || 0, updated_at: new Date().toISOString()
            }));
            if (!ratingRecords.length) return { success: false, error: "No valid ratings" };
            const { error } = await client.from("cat_name_ratings").upsert(ratingRecords, { onConflict: "user_name,name_id" });
            return { success: !error, savedCount: ratingRecords.length };
        }, { success: false, error: "Supabase offline" });
    }
};

/* =========================================================================
   ELO RATING
   ========================================================================= */

export class EloRating {
    constructor(public defaultRating = ELO_RATING.DEFAULT_RATING, public kFactor = ELO_RATING.DEFAULT_K_FACTOR) { }
    getExpectedScore(ra: number, rb: number) { return 1 / (1 + 10 ** ((rb - ra) / ELO_RATING.RATING_DIVISOR)); }
    updateRating(r: number, exp: number, act: number, games = 0) {
        const k = games < ELO_RATING.NEW_PLAYER_GAME_THRESHOLD ? this.kFactor * 2 : this.kFactor;
        return Math.round(r + k * (act - exp));
    }
    calculateNewRatings(ra: number, rb: number, outcome: string) {
        const expA = this.getExpectedScore(ra, rb);
        const expB = this.getExpectedScore(rb, ra);
        const actA = outcome === "left" ? 1 : outcome === "right" ? 0 : 0.5;
        const actB = outcome === "right" ? 1 : outcome === "left" ? 0 : 0.5;
        return { newRatingA: this.updateRating(ra, expA, actA), newRatingB: this.updateRating(rb, expB, actB) };
    }
}

/* =========================================================================
   PREFERENCE SORTER
   ========================================================================= */

export class PreferenceSorter {
    preferences = new Map<string, number>();
    currentIndex = 0;
    pairs: Array<[string, string]> = [];
    constructor(public items: string[]) {
        for (let i = 0; i < items.length - 1; i++)
            for (let j = i + 1; j < items.length; j++)
                this.pairs.push([items[i], items[j]]);
    }
    addPreference(a: string, b: string, val: number) { this.preferences.set(`${a}-${b}`, val); }
    getNextMatch() {
        while (this.currentIndex < this.pairs.length) {
            const [a, b] = this.pairs[this.currentIndex];
            if (!this.preferences.has(`${a}-${b}`) && !this.preferences.has(`${b}-${a}`)) return { left: a, right: b };
            this.currentIndex++;
        }
        return null;
    }
}

/* =========================================================================
   GENERAL UTILS
   ========================================================================= */

export const CAT_IMAGES = ["/assets/images/cat.gif", "/assets/images/bby-cat.GIF"];
export function getRandomCatImage(id: any, images = CAT_IMAGES) {
    const seed = typeof id === "string" ? id.length : Number(id);
    return images[seed % images.length];
}
export function computeRating(old: number, next: number, played: number, max: number) {
    const factor = Math.min(0.8, (played / max) * 0.9);
    return Math.round(factor * next + (1 - factor) * old);
}

/**
 * Build a map of comparisons from match history
 */
export function buildComparisonsMap(history: Array<{ winner: string; loser: string }>): Map<string, number> {
    const map = new Map<string, number>();
    for (const h of history) {
        map.set(`${h.winner}-${h.loser}`, 1);
    }
    return map;
}

/**
 * Calculate bracket round based on number of names and current match
 */
export function calculateBracketRound(totalNames: number, currentMatch: number): number {
    if (totalNames <= 2) return 1;
    const matchesPerRound = Math.ceil(totalNames / 2);
    return Math.ceil(currentMatch / matchesPerRound);
}

