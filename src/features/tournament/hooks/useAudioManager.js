/**
 * @module useAudioManager
 * @description Custom hook for managing audio playback in tournament component.
 * Handles background music, sound effects, volume control, and audio error handling.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ErrorManager } from '../../../shared/services/errorManager';
import { AUDIO, MUSIC_TRACKS, SOUND_EFFECTS } from '../../../core/constants';

/**
 * Custom hook for audio management
 * @returns {Object} Audio manager state and handlers
 */
export function useAudioManager() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState({ 
    music: AUDIO.DEFAULT_MUSIC_VOLUME, 
    effects: AUDIO.DEFAULT_EFFECTS_VOLUME 
  });
  const [audioError, setAudioError] = useState(null);

  const [currentTrack, setCurrentTrack] = useState(
    () => Math.floor(Math.random() * MUSIC_TRACKS.length)
  );
  const [isShuffle, setIsShuffle] = useState(false);

  const audioRef = useRef(null);
  const musicRef = useRef(null);
  const audioEventListeners = useRef(new Set());
  const musicEventListeners = useRef(new Set());

  // * Initialize audio
  useEffect(() => {
    const currentMusicEventListeners = musicEventListeners.current;
    const currentAudioEventListeners = audioEventListeners.current;

    audioRef.current = new Audio(SOUND_EFFECTS[0].path);
    audioRef.current.volume = volume.effects;

    musicRef.current = new Audio(MUSIC_TRACKS[0].path);
    musicRef.current.volume = volume.music;
    musicRef.current.loop = false; // allow auto-advance on 'ended'

    return () => {
      const currentMusicRef = musicRef.current;
      const currentAudioRef = audioRef.current;

      if (currentMusicRef) {
        currentMusicRef.pause();
        // * Remove all event listeners to prevent memory leaks
        currentMusicEventListeners.forEach(({ event, handler }) => {
          currentMusicRef.removeEventListener(event, handler);
        });
        currentMusicEventListeners.clear();
        musicRef.current = null;
      }
      if (currentAudioRef) {
        currentAudioRef.pause();
        // * Remove all event listeners to prevent memory leaks
        currentAudioEventListeners.forEach(({ event, handler }) => {
          currentAudioRef.removeEventListener(event, handler);
        });
        currentAudioEventListeners.clear();
        audioRef.current = null;
      }
    };
  }, [volume.effects, volume.music]);

  // * Get random sound effect based on weights
  const getRandomSoundEffect = useCallback(() => {
    const totalWeight = SOUND_EFFECTS.reduce(
      (sum, effect) => sum + effect.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const effect of SOUND_EFFECTS) {
      if (random < effect.weight) {
        return effect.path;
      }
      random -= effect.weight;
    }
    return SOUND_EFFECTS[0].path;
  }, []);

  // * Play sound effect
  const playSound = useCallback(() => {
    try {
      if (!isMuted && audioRef.current) {
        const soundEffect = getRandomSoundEffect();
        audioRef.current.src = soundEffect;
        audioRef.current.currentTime = 0;
        audioRef.current.volume = volume.effects;
        audioRef.current.play().catch((error) => {
          if (error.name !== "AbortError") {
            if (process.env.NODE_ENV === "development") {
              console.error("Error playing sound effect:", error);
            }
          }
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error playing sound effect:", error);
      }
    }
  }, [isMuted, volume.effects, getRandomSoundEffect]);

  // * Handle track changes
  useEffect(() => {
    const playNewTrack = async () => {
      try {
        if (musicRef.current) {
          musicRef.current.pause();
          await new Promise((resolve) => setTimeout(resolve, AUDIO.TRACK_CHANGE_DELAY));

          musicRef.current.src = MUSIC_TRACKS[currentTrack].path;
          musicRef.current.volume = volume.music;
          musicRef.current.loop = false;

          if (!isMuted) {
            await musicRef.current.play();
          }
        }
        setAudioError(null);
      } catch (error) {
        if (error.name !== "AbortError") {
          if (process.env.NODE_ENV === "development") {
            console.error("Error playing audio:", error);
          }
          setAudioError("Unable to play background music. Click to try again.");
        }
      }
    };

    playNewTrack();
  }, [currentTrack, isMuted, volume.music]);

  // * Auto-advance on track end
  useEffect(() => {
    const node = musicRef.current;
    if (!node) return;
    const onEnded = () => {
      setCurrentTrack((prev) => {
        if (isShuffle) {
          if (MUSIC_TRACKS.length <= 1) return prev;
          let next = Math.floor(Math.random() * MUSIC_TRACKS.length);
          if (next === prev) next = (prev + 1) % MUSIC_TRACKS.length;
          return next;
        }
        return (prev + 1) % MUSIC_TRACKS.length;
      });
    };

    // * Track event listener for proper cleanup
    const currentMusicEventListeners = musicEventListeners.current;
    currentMusicEventListeners.add({ event: "ended", handler: onEnded });
    node.addEventListener("ended", onEnded);

    return () => {
      node.removeEventListener("ended", onEnded);
      currentMusicEventListeners.delete({ event: "ended", handler: onEnded });
    };
  }, [isShuffle]);

  // * Toggle mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      try {
        if (newMuted) {
          if (musicRef.current) musicRef.current.pause();
          if (audioRef.current) audioRef.current.pause();
        } else if (musicRef.current) {
          setTimeout(() => {
            if (musicRef.current && !newMuted) {
              musicRef.current.play().catch((error) => {
                if (error.name !== "AbortError") {
                  setAudioError("Unable to play audio. Click to try again.");
                }
              });
            }
          }, AUDIO.AUDIO_RETRY_DELAY);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error toggling mute:", error);
        }
      }
      return newMuted;
    });
  }, []);

  // * Next track
  const handleNextTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev + 1) % MUSIC_TRACKS.length);
  }, []);

  // * Toggle shuffle
  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((s) => !s);
  }, []);

  // * Retry audio
  const retryAudio = useCallback(() => {
    if (audioError && !isMuted && musicRef.current) {
      setTimeout(() => {
        if (musicRef.current && !isMuted) {
          musicRef.current
            .play()
            .then(() => {
              setAudioError(null);
            })
            .catch((error) => {
              // * Ignore abort errors (user-initiated stops)
              if (error.name !== "AbortError") {
                // * Use ErrorManager for consistent error handling
                ErrorManager.handleError(error, 'Audio Playback', {
                  isRetryable: true,
                  affectsUserData: false,
                  isCritical: false
                });
                
                // * Set user-friendly error message
                setAudioError("Unable to play audio. Click to try again.");
                
                if (process.env.NODE_ENV === "development") {
                  console.warn("Audio playback error (non-critical):", error);
                }
              }
            });
        }
      }, AUDIO.AUDIO_RETRY_DELAY);
    }
  }, [audioError, isMuted]);

  // * Handle volume change
  const handleVolumeChange = useCallback((type, value) => {
    setVolume((prev) => {
      const newVolume = { ...prev, [type]: value };
      if (audioRef.current && type === "effects") {
        audioRef.current.volume = value;
      }
      if (musicRef.current && type === "music") {
        musicRef.current.volume = value;
      }
      return newVolume;
    });
  }, []);

  return {
    isMuted,
    volume,
    audioError,
    currentTrack,
    isShuffle,
    trackInfo: MUSIC_TRACKS[currentTrack],
    playSound,
    handleToggleMute,
    handleNextTrack,
    handleToggleShuffle,
    retryAudio,
    handleVolumeChange,
  };
}

