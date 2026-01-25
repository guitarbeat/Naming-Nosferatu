import { cx } from "class-variance-authority";
import type { ClassValue } from "class-variance-authority/types";

/* ==========================================================================
   CLASSNAME UTILITIES
   ========================================================================== */

/**
 * Combines class names using class-variance-authority
 */
export function cn(...inputs: ClassValue[]) {
	return cx(inputs);
}

/* ==========================================================================
   DISPLAY UTILITIES
   ========================================================================== */

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

/* ==========================================================================
   IMAGE UTILITIES
   ========================================================================== */

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

export const hapticNavTap = () => {
	if (typeof navigator !== "undefined" && navigator.vibrate) {
		navigator.vibrate(10);
	}
};

export const hapticTournamentStart = () => {
	if (typeof navigator !== "undefined" && navigator.vibrate) {
		navigator.vibrate([50, 50, 50]);
	}
};

/* ==========================================================================
   SOUND MANAGER
   ========================================================================== */

interface SoundConfig {
	volume?: number;
	preload?: boolean;
}

class SoundManager {
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private defaultVolume = 0.3;

	constructor() {
		this.preloadSounds();
	}

	private preloadSounds() {
		const sounds: string[] = [];

		sounds.forEach((soundName) => {
			const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
			audio.preload = "auto";
			audio.volume = this.defaultVolume;
			this.audioCache.set(soundName, audio);
		});
	}

	play(soundName: string, config: SoundConfig = {}) {
		try {
			const audio = this.audioCache.get(soundName);
			if (!audio) {
				console.warn(`Sound "${soundName}" not found in cache`);
				return;
			}

			const soundInstance = audio.cloneNode() as HTMLAudioElement;
			soundInstance.volume = config.volume ?? this.defaultVolume;
			soundInstance.currentTime = 0;

			const playPromise = soundInstance.play();

			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.debug("Sound playback blocked by browser policy:", error);
				});
			}
		} catch (error) {
			console.warn("Error playing sound:", error);
		}
	}

	setDefaultVolume(volume: number) {
		this.defaultVolume = Math.max(0, Math.min(1, volume));
	}

	canPlaySounds(): boolean {
		const soundEnabled = localStorage.getItem("sound-enabled");
		if (soundEnabled === "false") {
			return false;
		}

		try {
			const AudioContextClass =
				window.AudioContext ||
				(window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			const audioContext = new AudioContextClass();
			return audioContext.state !== "suspended";
		} catch {
			return false;
		}
	}
}

const soundManager = new SoundManager();

export const playSound = (soundName: string, config?: SoundConfig) => {
	if (soundManager.canPlaySounds()) {
		soundManager.play(soundName, config);
	}
};

/* ==========================================================================
   METRICS UTILITIES
   ========================================================================== */

interface InsightCategory {
	label: string;
	description: string;
	icon: string;
	color: string;
}

const INSIGHT_CATEGORIES: Record<string, InsightCategory> = {
	top_rated: {
		label: "Top Rated",
		description: "In the top 10% by rating",
		icon: "⭐",
		color: "var(--color-gold, #f59e0b)",
	},
	trending_up: {
		label: "Trending Up",
		description: "Gaining popularity",
		icon: "📈",
		color: "var(--color-success, #22c55e)",
	},
	trending_down: {
		label: "Trending Down",
		description: "Losing popularity",
		icon: "📉",
		color: "var(--color-danger, #ef4444)",
	},
	most_selected: {
		label: "Most Selected",
		description: "One of the top selections",
		icon: "👍",
		color: "var(--color-info, #3b82f6)",
	},
	underrated: {
		label: "Underrated",
		description: "Good rating but low selections",
		icon: "💎",
		color: "var(--color-purple, #a855f7)",
	},
	new: {
		label: "New",
		description: "Recently added",
		icon: "✨",
		color: "var(--color-cyan, #06b6d4)",
	},
	undefeated: {
		label: "Undefeated",
		description: "No losses yet",
		icon: "🏆",
		color: "var(--color-gold, #f59e0b)",
	},
	undiscovered: {
		label: "Undiscovered",
		description: "Never selected yet",
		icon: "🔍",
		color: "var(--color-subtle, #6b7280)",
	},
};

export function getInsightCategory(categoryKey: string): InsightCategory | null {
	return INSIGHT_CATEGORIES[categoryKey] || null;
}

const METRIC_LABELS: Record<string, string> = {
	rating: "Rating",
	total_wins: "Wins",
	selected: "Selected",
	avg_rating: "Avg Rating",
	wins: "Wins",
	dateSubmitted: "Date Added",
};

export function getMetricLabel(metricKey: string): string {
	return METRIC_LABELS[metricKey] || metricKey;
}

export function calculatePercentile(
	value: number,
	allValues: number[],
	higherIsBetter = true,
): number {
	if (!allValues || allValues.length === 0) {
		return 50;
	}

	const validValues = allValues.filter((v) => v != null && !Number.isNaN(v));
	if (validValues.length === 0) {
		return 50;
	}

	const sorted = [...validValues].sort((a, b) => a - b);

	if (higherIsBetter) {
		const belowCount = sorted.filter((v) => v < value).length;
		return Math.round((belowCount / sorted.length) * 100);
	} else {
		const aboveCount = sorted.filter((v) => v > value).length;
		return Math.round((aboveCount / sorted.length) * 100);
	}
}

export interface RatingData {
	rating: number;
	wins: number;
	losses: number;
}

export interface RatingItem extends RatingData {
	name: string;
}

export interface RatingDataInput {
	rating: number;
	wins?: number;
	losses?: number;
}

export function ratingsToArray(
	ratings: Record<string, RatingDataInput | number> | RatingItem[],
): RatingItem[] {
	if (Array.isArray(ratings)) {
		return ratings;
	}

	return Object.entries(ratings).map(([name, data]) => ({
		name,
		rating: typeof data === "number" ? data : (data as RatingDataInput)?.rating || 1500,
		wins: typeof data === "object" ? (data as RatingDataInput)?.wins || 0 : 0,
		losses: typeof data === "object" ? (data as RatingDataInput)?.losses || 0 : 0,
	}));
}

export function ratingsToObject(ratingsArray: RatingItem[]): Record<string, RatingData> {
	if (!Array.isArray(ratingsArray)) {
		return {};
	}

	return ratingsArray.reduce(
		(acc, item) => {
			acc[item.name] = {
				rating: item.rating || 1500,
				wins: item.wins || 0,
				losses: item.losses || 0,
			};
			return acc;
		},
		{} as Record<string, RatingData>,
	);
}
