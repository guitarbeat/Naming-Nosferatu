import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx logic.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
	const next = [...array];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = next[i] as T;
		next[i] = next[j] as T;
		next[j] = temp;
	}
	return next;
}

/**
 * Creates a stable, sorted string key from IDs/values for deduplication and comparison.
 */
export function createSortedKey(
	items: Array<string | number | { id: string | number } | null | undefined>,
): string {
	// ⚡ Bolt Optimization: Replaced `.map().filter(Boolean).map(String)` chain with a
	// single `for` loop to eliminate intermediate array allocations on hot paths.
	const result: string[] = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item) {
			const val = typeof item === "object" ? item.id : item;
			if (val) {
				result.push(String(val));
			}
		}
	}
	return result.sort().join(",");
}
