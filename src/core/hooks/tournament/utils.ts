import type { PreferenceSorter } from "../../../features/tournament/PreferenceSorter";
import type { Match, MatchRecord, NameItem } from "../../../shared/propTypes";
import {
	buildComparisonsMap,
	getPreferencesMap,
	initializeSorterPairs,
} from "../../../shared/utils/core";

export function getNextMatch(
	names: NameItem[],
	sorter: unknown,
	_matchNumber: number,
	options: {
		currentRatings?: Record<
			string,
			{ rating: number; wins?: number; losses?: number }
		>;
		history?: MatchRecord[];
	} = {},
): Match | null {
	if (!sorter || names.length <= 2) return null;

	const findBestMatch = () => {
		try {
			const nameList = names.filter((n) => n?.name);
			const s = sorter as PreferenceSorter;
			initializeSorterPairs(sorter, nameList);

			if (!Array.isArray(s.pairs) || s.pairs.length === 0) return null;

			const prefs = getPreferencesMap(sorter);
			const ratings = options.currentRatings || {};
			const history = options.history || [];
			const compHistory = history
				.filter((h) => h.winner && h.loser)
				.map((h) => ({
					winner: h.winner as string,
					loser: h.loser as string,
				}));
			const comparisons = buildComparisonsMap(compHistory);

			let bestPair: [string, string] | null = null;
			let bestScore = Infinity;
			const pairIndex = typeof s.currentIndex === "number" ? s.currentIndex : 0;

			for (let idx = pairIndex; idx < s.pairs.length; idx++) {
				const [a, b] = s.pairs[idx];
				if (prefs.has(`${a} -${b} `) || prefs.has(`${b} -${a} `)) continue;

				const ra =
					ratings[a]?.rating ||
					(typeof ratings[a] === "number"
						? (ratings[a] as unknown as number)
						: 1500);
				const rb =
					ratings[b]?.rating ||
					(typeof ratings[b] === "number"
						? (ratings[b] as unknown as number)
						: 1500);
				const diff = Math.abs(ra - rb);
				const ca = comparisons.get(a) || 0;
				const cb = comparisons.get(b) || 0;
				const uncScore = 1 / (1 + ca) + 1 / (1 + cb);
				const score = diff - 50 * uncScore;

				if (score < bestScore) {
					bestScore = score;
					bestPair = [a, b];
				}
			}

			if (bestPair) {
				const [a, b] = bestPair;
				s.currentIndex = Math.max(
					0,
					s.pairs.findIndex((p: [string, string]) => p[0] === a && p[1] === b),
				);
				return {
					left: names.find((n) => n?.name === a) || { name: a, id: a },
					right: names.find((n) => n?.name === b) || { name: b, id: b },
				} as Match;
			}
		} catch (e) {
			if (process.env.NODE_ENV === "development")
				console.warn("Adaptive next-match selection failed:", e);
		}
		return null;
	};

	if (options && (options.currentRatings || options.history)) {
		const match = findBestMatch();
		if (match) return match;
	}

	const s = sorter as PreferenceSorter;
	if (typeof s.getNextMatch === "function") {
		try {
			const nm = s.getNextMatch();
			if (nm) {
				return {
					left: names.find((n) => n?.name === nm.left) || {
						name: nm.left,
						id: nm.left,
					},
					right: names.find((n) => n?.name === nm.right) || {
						name: nm.right,
						id: nm.right,
					},
				} as Match;
			}
		} catch (error) {
			if (process.env.NODE_ENV === "development")
				console.warn("Could not get next match from sorter:", error);
		}
	}

	return findBestMatch();
}
