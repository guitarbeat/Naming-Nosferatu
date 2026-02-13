/**
 * @module sound
 * @description Sound playback management
 */

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

/**
 * Play a sound if audio is enabled
 */
export const playSound = (soundName: string, config?: SoundConfig) => {
	if (soundManager.canPlaySounds()) {
		soundManager.play(soundName, config);
	}
};
