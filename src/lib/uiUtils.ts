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

export const statusMessageMotionPreset = {
	initial: { opacity: 0, y: -6 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -6 },
	transition: { duration: MOTION_DURATIONS.fast },
} as const;

export function getRandomCatImage(
	id: string | number,
	images: readonly string[],
	fallbackName?: string,
): string {
	if (!images || images.length === 0) {
		return "";
	}
	const str = `${id}-${fallbackName || ""}`;
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	const index = Math.abs(hash) % images.length;
	return images[index] ?? images[0] ?? "";
}
