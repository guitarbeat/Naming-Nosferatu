/**
 * @module usePersonalResults
 * @description Transform a raw ratings record into a sorted rankings array.
 *
 * Accepts the flexible `Record<string, RatingData | number>` shape that the
 * store produces and normalizes it into a flat `RatingItem[]` sorted by rating
 * (descending), optionally enriched with IDs from the current tournament names.
 *
 * @example
 * const { rankings, setRankings } = usePersonalResults({
 *   personalRatings: tournament.ratings,
 *   currentTournamentNames: tournament.names ?? undefined,
 * });
 */

import { useEffect, useMemo, useState } from "react";
import type { NameItem, RatingData, RatingItem } from "@/types/appTypes";

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Flexible rating value — either a full `RatingData` object or a bare number
 * (interpreted as `{ rating: n, wins: 0, losses: 0 }`).
 */
type RatingValue = RatingData | number;

interface UsePersonalResultsProps {
	/** Ratings map from the store. `undefined` means "not loaded yet". */
	personalRatings: Record<string, RatingValue> | undefined;
	/** Optional name list to enrich each ranking entry with an `id`. */
	currentTournamentNames?: NameItem[];
}

interface UsePersonalResultsReturn {
	/** Sorted rankings (highest rating first). */
	rankings: RatingItem[];
	/** Escape hatch: manually override the rankings array. */
	setRankings: React.Dispatch<React.SetStateAction<RatingItem[]>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/** Normalize a single rating value into a consistent RatingData shape. */
function normalizeRating(value: RatingValue): RatingData {
	if (typeof value === "number") {
		return { rating: Math.round(value), wins: 0, losses: 0 };
	}
	return {
		rating: Math.round(value.rating ?? 1500),
		wins: value.wins ?? 0,
		losses: value.losses ?? 0,
	};
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════════

export function usePersonalResults({
	personalRatings,
	currentTournamentNames,
}: UsePersonalResultsProps): UsePersonalResultsReturn {
	const [rankings, setRankings] = useState<RatingItem[]>([]);

	// Build a name→id lookup map (only recomputed when names change)
	const nameIdMap = useMemo(() => {
		if (!currentTournamentNames) {
			return null;
		}
		const map = new Map<string, string | number>();
		for (const n of currentTournamentNames) {
			map.set(n.name, n.id);
		}
		return map;
	}, [currentTournamentNames]);

	useEffect(() => {
		if (!personalRatings) {
			return;
		}

		const entries = Object.entries(personalRatings);
		if (entries.length === 0) {
			setRankings([]);
			return;
		}

		const processed: RatingItem[] = entries.map(([name, value]) => {
			const { rating, wins, losses } = normalizeRating(value);
			return { name, rating, wins, losses };
		});

		// Enrich with IDs from tournament names if available
		if (nameIdMap) {
			for (const item of processed) {
				const id = nameIdMap.get(item.name);
				if (id !== undefined) {
					(item as RatingItem & { id?: string | number }).id = id;
				}
			}
		}

		// Sort descending by rating, then alphabetically by name for ties
		processed.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));

		setRankings(processed);
	}, [personalRatings, nameIdMap]);

	return { rankings, setRankings };
}
