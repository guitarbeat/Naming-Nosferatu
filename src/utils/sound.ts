/**
 * @module sound
 * @description Sound playback management
 */

interface SoundConfig {
	volume?: number;
	preload?: boolean;
}

export type { SoundConfig };

class SoundManager {
	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private defaultVolume = 0.3;

	constructor() {
		this.preloadSounds();
	}

	private preloadSounds() {
		const sounds: string[] = ["vote", "undo"];

		sounds.forEach((soundName) => {
			const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
			audio.preload = "auto";
			audio.volume = this.defaultVolume;
			this.audioCache.set(soundName, audio);
		});
	}

	play(soundName: string, config: SoundConfig = {}) {
		try {
			// Try to get from cache first
			let audio = this.audioCache.get(soundName);

			// If not in cache, try to create it on-demand
			if (!audio) {
				try {
					audio = new Audio(`/assets/sounds/${soundName}.mp3`);
					audio.volume = config.volume ?? this.defaultVolume;
					this.audioCache.set(soundName, audio);
				} catch (error) {
					console.warn(`Failed to load sound "${soundName}":`, error);
					// Fallback to console log for now
					if (soundName === "vote") {
						console.log("🔊 Vote sound (audio file not found)");
					} else if (soundName === "undo") {
						console.log("🔊 Undo sound (audio file not found)");
					}
					return;
				}
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

/**
 * Play a sound if audio is enabled
 */
export const playSound = (soundName: string, config?: SoundConfig) => {
	if (soundManager.canPlaySounds()) {
		soundManager.play(soundName, config);
	}
};
