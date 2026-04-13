import { getStorageString, isStorageAvailable } from "@/shared/lib/storage";
import { AUDIO, STORAGE_KEYS } from "@/shared/lib/constants";
import { 
	BACKGROUND_TRACKS, 
	SOUND_EFFECTS, 
	FALLBACK_MUSIC_PATTERNS, 
	getFallbackEffectPattern,
	type SynthNote 
} from "./sound/resources";
import { synthEngine } from "./sound/synthEngine";

interface SoundConfig {
	volume?: number;
	preload?: boolean;
}

class SoundManager {
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private backgroundMusic: HTMLAudioElement | null = null;
	private audioContext: AudioContext | null = null;
	private fallbackMusicTimeout: number | null = null;
	private fallbackMusicActive = false;
	private backgroundMusicRequested = false;
	private failedAssets: Set<string> = new Set();
	private defaultVolume = AUDIO.DEFAULT_EFFECTS_VOLUME;
	private backgroundMusicVolume = AUDIO.DEFAULT_MUSIC_VOLUME;
	private currentTrackIndex = 0;
	private readonly isBrowser = isStorageAvailable();

	constructor() {
		if (!this.isBrowser) {
			return;
		}
		this.preloadSounds();
		this.preloadBackgroundMusic();
	}

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
		return maybeError?.name === "NotAllowedError" || maybeError?.name === "AbortError";
	}

	private getAudioContext(): AudioContext | null {
		if (!this.isBrowser) {
			return null;
		}

		const browserGlobal = globalThis as typeof globalThis & {
			AudioContext?: typeof AudioContext;
			webkitAudioContext?: typeof AudioContext;
		};
		const AudioContextConstructor = browserGlobal.AudioContext || browserGlobal.webkitAudioContext;
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

	private stopFallbackMusic() {
		this.fallbackMusicActive = false;
		if (this.fallbackMusicTimeout !== null) {
			window.clearTimeout(this.fallbackMusicTimeout);
			this.fallbackMusicTimeout = null;
		}
	}

	private startFallbackMusic() {
		if (!this.isBrowser || !this.canPlaySounds()) {
			return;
		}

		this.stopFallbackMusic();
		this.fallbackMusicActive = true;

		const playLoop = () => {
			if (!this.fallbackMusicActive || !this.backgroundMusicRequested) {
				return;
			}

			const pattern = FALLBACK_MUSIC_PATTERNS[this.currentTrackIndex % FALLBACK_MUSIC_PATTERNS.length] ?? FALLBACK_MUSIC_PATTERNS[0];
			if (!pattern) {
				return;
			}
			
			const context = this.getAudioContext();
			const leadDuration = synthEngine.playSequence(
				context,
				pattern,
				Math.max(0.04, this.backgroundMusicVolume * 0.7),
			);

			// Add a low bass pulse every other beat to keep loop energy up.
			const bassPattern = pattern
				.filter((_, index) => index % 2 === 0)
				.map((note) => ({
					frequency: note.frequency / 2,
					duration: note.duration * 2,
					gain: 0.5,
					wave: "sine" as OscillatorType,
				}));
			const bassDuration = synthEngine.playSequence(
				context,
				bassPattern,
				Math.max(0.03, this.backgroundMusicVolume * 0.5),
			);

			const loopDurationMs = Math.max(
				AUDIO.FALLBACK_LOOP_MIN_DURATION_MS,
				Math.round(Math.max(leadDuration, bassDuration, 1.35) * 1000),
			);
			this.fallbackMusicTimeout = window.setTimeout(playLoop, loopDurationMs - AUDIO.FALLBACK_LOOP_OVERLAP_MS);
		};

		playLoop();
	}

	private preloadSounds() {
		SOUND_EFFECTS.forEach((soundName) => {
			const audio = this.createAudioElement(soundName);
			if (audio) {
				audio.volume = this.defaultVolume;
				this.audioCache.set(soundName, audio);
			}
		});
	}

	private preloadBackgroundMusic() {
		this.loadBackgroundTrack(BACKGROUND_TRACKS[this.currentTrackIndex] ?? "");
	}

	playNextTrack() {
		this.currentTrackIndex = (this.currentTrackIndex + 1) % BACKGROUND_TRACKS.length;
		const nextTrack = BACKGROUND_TRACKS[this.currentTrackIndex];
		if (nextTrack) {
			this.loadBackgroundTrack(nextTrack);
			if (this.backgroundMusicRequested) {
				this.playBackgroundMusic();
			}
		}
	}

	playPreviousTrack() {
		this.currentTrackIndex = (this.currentTrackIndex - 1 + BACKGROUND_TRACKS.length) % BACKGROUND_TRACKS.length;
		const prevTrack = BACKGROUND_TRACKS[this.currentTrackIndex];
		if (prevTrack) {
			this.loadBackgroundTrack(prevTrack);
			if (this.backgroundMusicRequested) {
				this.playBackgroundMusic();
			}
		}
	}

	private loadBackgroundTrack(trackName: string) {
		if (this.backgroundMusic) {
			this.backgroundMusic.pause();
		}

		const audio = this.createAudioElement(trackName);
		if (!audio) {
			this.backgroundMusic = null;
			return;
		}

		this.backgroundMusic = audio;
		this.backgroundMusic.loop = true;
		this.backgroundMusic.volume = this.backgroundMusicVolume;
	}

	getCurrentTrack(): string {
		return BACKGROUND_TRACKS[this.currentTrackIndex] || "Unknown Track";
	}

	getAvailableSongs(): string[] {
		return [...BACKGROUND_TRACKS];
	}

	getAvailableSoundEffects(): string[] {
		return [...SOUND_EFFECTS];
	}

	isSong(soundName: string): boolean {
		return BACKGROUND_TRACKS.includes(soundName);
	}

	isSoundEffect(soundName: string): boolean {
		return SOUND_EFFECTS.includes(soundName);
	}

	play(soundName: string, config: SoundConfig = {}) {
		if (!this.canPlaySounds()) {
			return;
		}

		try {
			const volume = config.volume ?? this.defaultVolume;

			if (this.failedAssets.has(soundName)) {
				this.playFallbackEffect(soundName, volume);
				return;
			}

			let audio: HTMLAudioElement | null = this.audioCache.get(soundName) ?? this.createAudioElement(soundName);

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
		} catch (error) {
			this.playFallbackEffect(soundName, config.volume ?? this.defaultVolume);
		}
	}

	setDefaultVolume(volume: number) {
		this.defaultVolume = Math.max(0, Math.min(1, volume));
	}

	playBackgroundMusic() {
		this.backgroundMusicRequested = true;
		if (!this.canPlaySounds()) {
			return;
		}

		const trackName = BACKGROUND_TRACKS[this.currentTrackIndex];
		if (!trackName || this.failedAssets.has(trackName) || !this.backgroundMusic) {
			this.startFallbackMusic();
			return;
		}

		this.stopFallbackMusic();
		this.backgroundMusic.currentTime = 0;
		this.backgroundMusic.play().catch((error) => {
			if (this.isAutoplayError(error)) {
				return;
			}
			this.failedAssets.add(trackName);
			this.startFallbackMusic();
		});
	}

	stopBackgroundMusic() {
		this.backgroundMusicRequested = false;
		if (this.backgroundMusic) {
			this.backgroundMusic.pause();
			this.backgroundMusic.currentTime = 0;
		}
		this.stopFallbackMusic();
	}

	setBackgroundMusicVolume(volume: number) {
		this.backgroundMusicVolume = Math.max(0, Math.min(1, volume));
		if (this.backgroundMusic) {
			this.backgroundMusic.volume = this.backgroundMusicVolume;
		}
	}

	canPlaySounds(): boolean {
		if (!this.isBrowser) {
			return false;
		}
		const soundEnabled = getStorageString(STORAGE_KEYS.SOUND_ENABLED) ?? getStorageString("sound-enabled");
		return soundEnabled !== "false";
	}
}

const soundManager = new SoundManager();

/**
 * Core Audio Service Exports
 */
export const playSound = (soundName: string, config?: SoundConfig) => {
	if (soundManager.canPlaySounds()) {
		soundManager.play(soundName, config);
	}
};

export const playBackgroundMusic = () => soundManager.playBackgroundMusic();
export const stopBackgroundMusic = () => soundManager.stopBackgroundMusic();
export const setBackgroundMusicVolume = (volume: number) => soundManager.setBackgroundMusicVolume(volume);
export const playNextTrack = () => soundManager.playNextTrack();
export const playPreviousTrack = () => soundManager.playPreviousTrack();
export const getCurrentTrack = () => soundManager.getCurrentTrack();

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
};
