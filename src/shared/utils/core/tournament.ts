import type { NameItem } from "../../../types/components";
import { generatePairs } from ".";

export interface Sorter {
	_pairs?: Array<[unknown, unknown]>;
	_pairIndex?: number;
	preferences?: Map<string, unknown>;
}

export function initializeSorterPairs(sorter: Sorter | null, nameList: NameItem[]): void {
	if (!sorter) {
		return;
	}
	if (!Array.isArray(sorter._pairs)) {
		const validNameList = Array.isArray(nameList) ? nameList : [];
		sorter._pairs = generatePairs(validNameList);
		sorter._pairIndex = 0;
	}
}

export function getPreferencesMap(sorter: Sorter): Map<string, unknown> {
	return sorter.preferences instanceof Map ? sorter.preferences : new Map();
}

export function calculateMaxRoundForNames(namesCount: number): number {
	let maxRound = 1;
	let remainingNames = namesCount;

	while (remainingNames > 1) {
		const matchesThisRound = Math.floor(remainingNames / 2);
		const winners = matchesThisRound;
		const byes = remainingNames % 2;
		remainingNames = winners + byes;
		maxRound++;
	}

	return maxRound;
}

export function calculateBracketRound(namesCount: number, matchNumber: number): number {
	if (!Number.isInteger(namesCount) || namesCount < 1) {
		return 1;
	}
	if (!Number.isInteger(matchNumber) || matchNumber < 1) {
		return 1;
	}

	const maxMatches = namesCount - 1;
	if (matchNumber > maxMatches) {
		return calculateMaxRoundForNames(namesCount);
	}

	if (namesCount === 2) {
		return 1;
	}

	let roundNumber = 1;
	let remainingNames = namesCount;
	let matchesPlayed = 0;
	const maxRounds = Math.ceil(Math.log2(namesCount)) + 1;

	while (matchesPlayed < matchNumber - 1 && roundNumber < maxRounds) {
		const matchesThisRound = Math.floor(remainingNames / 2);

		if (matchesPlayed + matchesThisRound >= matchNumber) {
			break;
		}

		matchesPlayed += matchesThisRound;
		const winners = matchesThisRound;
		const byes = remainingNames % 2;
		remainingNames = winners + byes;
		roundNumber++;
	}

	return roundNumber;
}
