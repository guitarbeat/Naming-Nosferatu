import type { NameItem } from "../../propTypes";

// * Shuffles an array using the Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

// * Generate all possible pairs from a list of names
export function generatePairs(nameList: NameItem[]): [NameItem, NameItem][] {
	const pairs: [NameItem, NameItem][] = [];
	for (let i = 0; i < nameList.length; i++) {
		for (let j = i + 1; j < nameList.length; j++) {
			pairs.push([nameList[i], nameList[j]]);
		}
	}
	return pairs;
}

export interface ComparisonHistory {
	winner: string;
	loser: string;
}

// * Build a comparisons map from tournament history
export function buildComparisonsMap(
	history: ComparisonHistory[],
): Map<string, number> {
	const comparisons = new Map<string, number>();

	for (const { winner, loser } of history) {
		const pair = [winner, loser].sort().join(":");
		comparisons.set(pair, (comparisons.get(pair) || 0) + 1);
	}

	return comparisons;
}
