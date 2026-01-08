import type { NameItem } from "../../types/components";

// * Shuffles an array using the Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		// biome-ignore lint/style/noNonNullAssertion: Array indices are guaranteed valid within loop bounds
		const temp = newArray[i]!;
		// biome-ignore lint/style/noNonNullAssertion: Array indices are guaranteed valid within loop bounds
		newArray[i] = newArray[j]!;
		newArray[j] = temp;
	}
	return newArray;
}

// * Generate all possible pairs from a list of names
export function generatePairs(nameList: NameItem[]): [NameItem, NameItem][] {
	const pairs: [NameItem, NameItem][] = [];
	for (let i = 0; i < nameList.length; i++) {
		for (let j = i + 1; j < nameList.length; j++) {
			const nameA = nameList[i];
			const nameB = nameList[j];
			if (nameA && nameB) {
				pairs.push([nameA, nameB]);
			}
		}
	}
	return pairs;
}
