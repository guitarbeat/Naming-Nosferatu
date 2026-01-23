export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}

export function getRankDisplay(rank: number): string {
	if (rank === 1) {
		return "🥇 1st";
	}
	if (rank === 2) {
		return "🥈 2nd";
	}
	if (rank === 3) {
		return "🥉 3rd";
	}
	if (rank <= 10) {
		return `🏅 ${rank}th`;
	}
	return `${rank}th`;
}

export function normalizeRoutePath(routeValue: string): string {
	if (!routeValue) {
		return "/";
	}
	return routeValue.startsWith("/") ? routeValue : `/${routeValue}`;
}

const isBrowser = () => typeof window !== "undefined";
const canUseMatchMedia = () => isBrowser() && typeof window.matchMedia === "function";

export const getMediaQueryList = (query: string): MediaQueryList | null => {
	if (!canUseMatchMedia()) {
		return null;
	}
	try {
		return window.matchMedia(query);
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			console.warn("Invalid media query:", query, error);
		}
		return null;
	}
};

export const attachMediaQueryListener = (
	mediaQueryList: MediaQueryList | null,
	listener: (event: MediaQueryListEvent) => void,
): (() => void) => {
	if (!mediaQueryList || typeof listener !== "function") {
		return () => {
			// Intentional no-op: invalid parameters, no cleanup needed
		};
	}
	if (typeof mediaQueryList.addEventListener === "function") {
		mediaQueryList.addEventListener("change", listener);
		return () => mediaQueryList.removeEventListener("change", listener);
	}
	return () => {
		// Intentional no-op: fallback for browsers without addEventListener
	};
};

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined") {
			reject(new Error("Browser environment required"));
			return;
		}
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			reject(e);
		};
		img.src = url;
	});
}

export async function compressImageFile(
	file: File,
	{
		maxWidth = 1600,
		maxHeight = 1600,
		quality = 0.8,
	}: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<File> {
	try {
		if (typeof document === "undefined") {
			return file;
		}
		const img = await loadImageFromFile(file);
		const { width, height } = img;
		const scale = Math.min(maxWidth / width, maxHeight / height, 1);
		const targetW = Math.round(width * scale);
		const targetH = Math.round(height * scale);

		const canvas = document.createElement("canvas");
		canvas.width = targetW;
		canvas.height = targetH;
		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) {
			return file;
		}
		ctx.drawImage(img, 0, 0, targetW, targetH);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/webp", Math.min(Math.max(quality, 0.1), 0.95)),
		);
		if (!blob) {
			return file;
		}

		const base = file.name.replace(/\.[^.]+$/, "") || "image";
		return new File([blob], `${base}.webp`, { type: "image/webp" });
	} catch {
		return file;
	}
}

/* ==========================================================================
   HAPTIC FEEDBACK UTILITIES
   ========================================================================== */

/**
 * Type for haptic feedback vibration patterns
 */
export type HapticPattern = number[];

/**
 * Haptic feedback patterns for different user interactions
 */
export const HAPTIC_PATTERNS = {
	/** Light tap for navigation and general UI interactions */
	light: [10],
	/** Medium feedback for secondary actions */
	medium: [25],
	/** Strong feedback for primary actions like starting tournaments */
	strong: [50, 50, 50],
	/** Success feedback with a pleasant double vibration */
	success: [30, 100, 30],
	/** Error feedback with an attention-grabbing pattern */
	error: [100, 50, 100, 50, 100],
} as const;

/**
 * Trigger haptic feedback with a specified pattern
 * @param pattern - Array of vibration durations in milliseconds (alternating vibration/pause)
 * @returns Promise that resolves when vibration completes
 */
export function triggerHapticFeedback(pattern: readonly number[]): Promise<void> {
	return new Promise((resolve) => {
		if (navigator.vibrate) {
			navigator.vibrate(pattern);
			// Resolve after the vibration pattern completes
			const totalDuration = pattern.reduce((sum, duration) => sum + duration, 0);
			setTimeout(resolve, totalDuration);
		} else {
			// No haptic support, resolve immediately
			resolve();
		}
	});
}

/**
 * Convenience function for navigation tap feedback
 */
export function hapticNavTap(): Promise<void> {
	return triggerHapticFeedback(HAPTIC_PATTERNS.light);
}

/**
 * Convenience function for tournament start feedback
 */
export function hapticTournamentStart(): Promise<void> {
	return triggerHapticFeedback([...HAPTIC_PATTERNS.strong]);
}
