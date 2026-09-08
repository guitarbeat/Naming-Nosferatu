import { CAT_IMAGES } from "./constants";

// ============================================================================
// MEDIA & IMAGE HELPERS (Consolidated from media.ts)
// ============================================================================

/**
 * Generates a simple hash for a string or number.
 */
function hashString(str: string): number {
	let hash = 2166136261;
	for (let i = 0; i < str.length; i += 1) {
		hash ^= str.charCodeAt(i);
		hash *= 16777619;
	}
	return hash;
}

const imageCache = new Map<string, string>();
const MAX_IMAGE_CACHE_SIZE = 500;

const NAME_IMAGE_MAPPING: Record<string, string> = {
	Nosferatu: CAT_IMAGES[8],
	Shadow: CAT_IMAGES[9],
	Luna: CAT_IMAGES[0],
	Milo: CAT_IMAGES[10],
	Miso: CAT_IMAGES[1],
	Pixel: CAT_IMAGES[2],
	Saffron: CAT_IMAGES[3],
	Noodle: CAT_IMAGES[4],
	Ziggy: CAT_IMAGES[5],
	Whiskers: CAT_IMAGES[6],
	Pepper: CAT_IMAGES[7],
	Barnaby: CAT_IMAGES[11],
};

/**
 * Consistently returns a "random" cat image for a given ID.
 * The same ID will always return the same image for the same images pool.
 */
export function getRandomCatImage(
	id: string | number | null | undefined,
	images: readonly string[] = CAT_IMAGES,
	name?: string,
): string {
	if (name && NAME_IMAGE_MAPPING[name]) {
		return NAME_IMAGE_MAPPING[name];
	}

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
	while (imageCache.size > MAX_IMAGE_CACHE_SIZE) {
		const firstKey = imageCache.keys().next().value;
		if (firstKey) {
			imageCache.delete(firstKey);
		} else {
			break;
		}
	}
	return selected;
}

// ============================================================================
// DESIGN TOKENS & SURFACE CLASSES (Consolidated from themeClasses.ts)
// ============================================================================

/**
 * Shared Tailwind class groups aligned with design tokens in src/index.css.
 * Prefer these over ad-hoc border-white/10 and bg-black/15 patterns.
 */

export const MOTION_DURATIONS = {
	fast: 0.15,
	base: 0.25,
	moderate: 0.4,
	gentle: 0.6,
	reducedMotionDuration: 0.01,
};

export const MOTION_EASING = {
	easeOutExpo: [0.16, 1, 0.3, 1] as const,
	easeStandard: [0.4, 0.0, 0.2, 1] as const,
};

export const fadeMotionPreset = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: {
		duration: MOTION_DURATIONS.base,
		ease: MOTION_EASING.easeOutExpo,
	},
};

export const scaleFadeMotionPreset = {
	initial: { opacity: 0, scale: 0.95 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
	transition: {
		duration: MOTION_DURATIONS.base,
		ease: MOTION_EASING.easeOutExpo,
	},
};

export const statusMessageMotionPreset = {
	initial: { opacity: 0, y: -4 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -4 },
	transition: {
		duration: MOTION_DURATIONS.fast,
		ease: MOTION_EASING.easeStandard,
	},
};
