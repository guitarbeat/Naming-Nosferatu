import { CAT_IMAGES } from "./constants";

export const MOTION_DURATIONS = {
	reducedMotionDuration: 0.01,
	fast: 0.15,
	base: 0.2,
	moderate: 0.35,
	gentle: 0.5,
} as const;

export const fadeMotionPreset = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: MOTION_DURATIONS.base },
} as const;

export const scaleFadeMotionPreset = {
	initial: { opacity: 0, scale: 0.95 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
	transition: { duration: MOTION_DURATIONS.base },
} as const;

const catImageCache = new Map<string, string>();
const MAX_CAT_IMAGE_CACHE_SIZE = 256;

export function isMobileOrLowPowerDevice(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	const isSmallScreen = window.innerWidth <= 768;
	const isCoarsePointer =
		typeof window.matchMedia === "function" &&
		Boolean(window.matchMedia("(pointer: coarse)").matches);
	const hasLowConcurrency =
		typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4;
	return Boolean(isSmallScreen || (isCoarsePointer && hasLowConcurrency));
}

export function getRandomCatImage(
	id: string | number,
	images: readonly string[] = CAT_IMAGES,
	fallbackName?: string,
): string {
	if (!images || images.length === 0) {
		return "";
	}
	const cacheKey = `${id}-${fallbackName || ""}`;
	const cached = catImageCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	let hash = 0;
	for (let i = 0; i < cacheKey.length; i++) {
		hash = (hash << 5) - hash + cacheKey.charCodeAt(i);
		hash |= 0;
	}
	const index = Math.abs(hash) % images.length;
	const result = images[index] ?? images[0] ?? "";

	if (catImageCache.size >= MAX_CAT_IMAGE_CACHE_SIZE) {
		const firstKey = catImageCache.keys().next().value;
		if (firstKey !== undefined) {
			catImageCache.delete(firstKey);
		}
	}
	catImageCache.set(cacheKey, result);

	return result;
}
