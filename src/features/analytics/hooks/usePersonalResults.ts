import { useEffect, useState } from "react";
import type { NameItem } from "@/shared/types";

export function usePersonalResults({
	personalRatings,
	currentTournamentNames,
}: {
	personalRatings: Record<string, unknown> | undefined;
	currentTournamentNames?: NameItem[];
}) {
	const [rankings, setRankings] = useState<NameItem[]>([]);

	useEffect(() => {
		if (!personalRatings) {
			return;
		}
		// Build a map from ID -> name since personalRatings is keyed by ID
		const idToNameMap = new Map<string, string>();
		if (currentTournamentNames) {
			for (const n of currentTournamentNames) {
				if (n.id !== undefined) {
					idToNameMap.set(String(n.id), n.name);
				}
			}
		}

		const processed = Object.entries(personalRatings)
			.map(([id, rating]: [string, unknown]) => {
				const r = rating as { rating?: number; wins?: number; losses?: number } | number;
				// Look up the actual name for this ID
				const actualName = idToNameMap.get(id) || id;
				return {
					name: actualName,
					rating: Math.round(typeof r === "number" ? r : r?.rating || 1500),
					wins: typeof r === "number" ? 0 : r?.wins || 0,
					losses: typeof r === "number" ? 0 : r?.losses || 0,
					id,
				};
			})
			.sort((a, b) => b.rating - a.rating);
		setRankings(processed as NameItem[]);
	}, [personalRatings, currentTournamentNames]);

	return { rankings, setRankings };
}
