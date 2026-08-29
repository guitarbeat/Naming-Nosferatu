import { type ClassValue, clsx } from "clsx";
import { type ComponentType, lazy } from "react";
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

export function addToSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
	const next = new Set(source);
	next.add(value);
	return next;
}

export function addManyToSet<T>(source: ReadonlySet<T>, values: Iterable<T>): Set<T> {
	const next = new Set(source);
	for (const value of values) {
		next.add(value);
	}
	return next;
}

export function removeFromSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
	const next = new Set(source);
	next.delete(value);
	return next;
}

export function toggleInSet<T>(source: ReadonlySet<T>, value: T): Set<T> {
	if (source.has(value)) {
		return removeFromSet(source, value);
	}
	return addToSet(source, value);
}
/**
 * Triggers a light haptic feedback for navigation taps.
 */
export function hapticNavTap(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.(10);
	}
}

/**
 * Triggers a sequence of haptic feedback for tournament starts.
 */
export function hapticTournamentStart(): void {
	if (typeof navigator !== "undefined") {
		navigator.vibrate?.([50, 50, 50]);
	}
}

/**
 * Robust lazy import helper that automatically retries/reloads once if dynamic chunk loading fails (e.g. after server restart or redeploy).
 */
export function safeLazy<T extends ComponentType<unknown>>(
	importFn: () => Promise<{ default: T }>,
) {
	return lazy(async () => {
		try {
			return await importFn();
		} catch (error) {
			const key = "app_chunk_load_retry";
			if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
				const lastReload = sessionStorage.getItem(key);
				const now = Date.now();
				if (!lastReload || now - Number(lastReload) > 15000) {
					sessionStorage.setItem(key, String(now));
					window.location.reload();
				}
			}
			throw error;
		}
	});
}
