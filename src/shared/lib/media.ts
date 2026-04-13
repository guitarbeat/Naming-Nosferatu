import { CAT_IMAGES } from "./constants";

/**
 * Generates a simple hash for a string or number.
 */
export function hashString(str: string): number {
	let hash = 2166136261;
	for (let i = 0; i < str.length; i += 1) {
		hash ^= str.charCodeAt(i);
		hash *= 16777619;
	}
	return hash;
}

const imageCache = new Map<string, string>();

/**
 * Consistently returns a "random" cat image for a given ID.
 * The same ID will always return the same image for the same images pool.
 */
export function getRandomCatImage(
	id: string | number | null | undefined,
	images: readonly string[] = CAT_IMAGES,
): string {
	if (!id || images.length === 0) {
		return images[0] ?? "";
	}

	const cacheKey = `${id}-${images.length}`;
	const cached = imageCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const seed = typeof id === "string" ? hashString(id) : Number(id);
	const index = Math.abs(seed) % images.length;
	const selected = images[index] ?? images[0] ?? "";
	imageCache.set(cacheKey, selected);
	return selected;
}
