import { AUDIO, STORAGE_KEYS } from "@/shared/lib/constants";
import { getStorageString, isStorageAvailable } from "@/shared/lib/storage";
import { getFallbackEffectPattern, SOUND_EFFECTS } from "./sound/resources";
import { synthEngine } from "./sound/synthEngine";

interface SoundConfig {
	volume?: number;
}

class SoundManager {
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private audioContext: AudioContext | null = null;
	private failedAssets: Set<string> = new Set();
	private defaultVolume = AUDIO.DEFAULT_EFFECTS_VOLUME;
	private get isBrowser() {
		return isStorageAvailable();
	}
	private preloaded = false;

	private createAudioElement(name: string): HTMLAudioElement | null {
		if (typeof Audio === "undefined") {
			return null;
		}

		const audio = new Audio(`/assets/sounds/${name}.mp3`);
		audio.preload = "auto";
		audio.addEventListener(
			"error",
			() => {
				this.failedAssets.add(name);
			},
			{ once: true },
		);
		return audio;
	}

	private isAutoplayError(error: unknown): boolean {
		const maybeError = error as { name?: string } | null;
		return (
			maybeError?.name === "NotAllowedError" ||
			maybeError?.name === "AbortError"
		);
	}

	private getAudioContext(): AudioContext | null {
		if (!this.isBrowser) {
			return null;
		}

		const browserGlobal = globalThis as typeof globalThis & {
			AudioContext?: typeof AudioContext;
			webkitAudioContext?: typeof AudioContext;
		};
		const AudioContextConstructor =
			browserGlobal.AudioContext || browserGlobal.webkitAudioContext;
		if (!AudioContextConstructor) {
			return null;
		}

		if (!this.audioContext) {
			this.audioContext = new AudioContextConstructor();
		}

		const context = this.audioContext;
		if (context.state === "suspended") {
			context.resume().catch(() => {
				/* ignore browser policy errors */
			});
		}

		return context;
	}

	private playFallbackEffect(soundName: string, volume: number) {
		const pattern = getFallbackEffectPattern(soundName);
		if (!pattern) {
			return;
		}
		synthEngine.playSequence(this.getAudioContext(), pattern, volume);
	}

	private preloadSounds() {
		// ⚡ Bolt Optimization: Use for...of instead of forEach for faster iteration
		for (const soundName of SOUND_EFFECTS) {
			const audio = this.createAudioElement(soundName);
			if (audio) {
				audio.volume = this.defaultVolume;
				this.audioCache.set(soundName, audio);
			}
		}
	}

	play(soundName: string, config: SoundConfig = {}) {
		if (!this.canPlaySounds()) {
			return;
		}

		if (!this.preloaded) {
			this.preloaded = true;
			this.preloadSounds();
		}

		try {
			const volume = config.volume ?? this.defaultVolume;

			if (this.failedAssets.has(soundName)) {
				this.playFallbackEffect(soundName, volume);
				return;
			}

			const audio: HTMLAudioElement | null =
				this.audioCache.get(soundName) ?? this.createAudioElement(soundName);

			if (!audio) {
				this.failedAssets.add(soundName);
				this.playFallbackEffect(soundName, volume);
				return;
			}

			audio.volume = volume;
			this.audioCache.set(soundName, audio);

			const soundInstance = audio.cloneNode() as HTMLAudioElement;
			soundInstance.volume = volume;
			soundInstance.currentTime = 0;
			soundInstance.addEventListener(
				"error",
				() => {
					this.failedAssets.add(soundName);
					this.playFallbackEffect(soundName, volume);
				},
				{ once: true },
			);

			const playPromise = soundInstance.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					if (this.isAutoplayError(error)) {
						return;
					}
					this.failedAssets.add(soundName);
					this.playFallbackEffect(soundName, volume);
				});
			}
		} catch (_error) {
			this.playFallbackEffect(soundName, config.volume ?? this.defaultVolume);
		}
	}

	canPlaySounds(): boolean {
		if (!this.isBrowser) {
			return false;
		}
		const soundEnabled =
			getStorageString(STORAGE_KEYS.SOUND_ENABLED) ??
			getStorageString("sound-enabled");
		return soundEnabled !== "false";
	}
}

export const soundManager = new SoundManager();

/**
 * Core Audio Service Exports
 */
const playSound = (soundName: string, config?: SoundConfig) => {
	if (soundManager.canPlaySounds()) {
		soundManager.play(soundName, config);
	}
};

/**
 * Consolidated Sound Effects
 */
export const AudioEffects = {
	playLevelUp: (config?: SoundConfig) => playSound("level-up", config),
	playWow: (config?: SoundConfig) => playSound("wow", config),
	playSurprise: (config?: SoundConfig) => playSound("surprise", config),
	playStreak: (config?: SoundConfig) => playSound("streak", config),
	playVote: (config?: SoundConfig) => playSound("vote", config),
	playUndo: (config?: SoundConfig) => playSound("undo", config),
	playMeow: (config?: SoundConfig) => playSound("meow", config),
};
