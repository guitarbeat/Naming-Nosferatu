/**
 * Sound Manager Utility
 * Handles audio playback for UI interactions
 */

interface SoundConfig {
  volume?: number;
  preload?: boolean;
}

class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private defaultVolume = 0.3; // 30% volume by default

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds() {
    const sounds = ["gameboy-pluck", "level-up", "surprise", "wow"];

    sounds.forEach((soundName) => {
      const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
      audio.preload = "auto";
      audio.volume = this.defaultVolume;
      this.audioCache.set(soundName, audio);
    });
  }

  /**
   * Play a sound effect
   * @param soundName - Name of the sound file (without .mp3 extension)
   * @param config - Optional configuration for volume and other settings
   */
  play(soundName: string, config: SoundConfig = {}) {
    try {
      const audio = this.audioCache.get(soundName);
      if (!audio) {
        console.warn(`Sound "${soundName}" not found in cache`);
        return;
      }

      // Create a new instance for overlapping sounds
      const soundInstance = audio.cloneNode() as HTMLAudioElement;
      soundInstance.volume = config.volume ?? this.defaultVolume;

      // Reset to beginning in case it's already playing
      soundInstance.currentTime = 0;

      const playPromise = soundInstance.play();

      // Handle play promise for browsers that require user interaction
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silently handle autoplay policy violations
          console.debug("Sound playback blocked by browser policy:", error);
        });
      }
    } catch (error) {
      console.warn("Error playing sound:", error);
    }
  }

  /**
   * Set the default volume for all sounds
   * @param volume - Volume level (0.0 to 1.0)
   */
  setDefaultVolume(volume: number) {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check if sounds can be played (respects user preferences)
   */
  canPlaySounds(): boolean {
    // Check for user preference (could be stored in localStorage)
    const soundEnabled = localStorage.getItem("sound-enabled");
    if (soundEnabled === "false") {
      return false;
    }

    // Check if audio context is available and not suspended
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextClass();
      return audioContext.state !== "suspended";
    } catch {
      return false;
    }
  }
}

// Create and export a singleton instance
export const soundManager = new SoundManager();

// Export convenience functions
export const playSound = (soundName: string, config?: SoundConfig) => {
  if (soundManager.canPlaySounds()) {
    soundManager.play(soundName, config);
  }
};
