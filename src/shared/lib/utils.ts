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

	// getRandomValues has a limit of 65536 bytes (16384 Uint32s).
	// To support arrays larger than this, we iterate and chunk if necessary.
	const MAX_UINT32_PER_CALL = 16384;
	const randomBuffer = new Uint32Array(next.length);
	for (let i = 0; i < next.length; i += MAX_UINT32_PER_CALL) {
		const chunk = randomBuffer.subarray(i, i + MAX_UINT32_PER_CALL);
		crypto.getRandomValues(chunk);
	}

	for (let i = next.length - 1; i > 0; i -= 1) {
		const randomValue = randomBuffer[i] ?? 0;
		const randomFloat = randomValue / (0xffffffff + 1);
		const j = Math.floor(randomFloat * (i + 1));
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
	// ⚡ Bolt Optimization: Replace map/filter/map chain with a single-pass loop
	const validItems: string[] = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const val = item && typeof item === "object" ? item.id : item;
		if (val) {
			validItems.push(String(val));
		}
	}
	return validItems.sort().join(",");
}
