import { useCallback, useMemo, useState } from "react";

/**
 * Lightweight audio manager stub to keep tournament UI stable.
 * Provides the same surface area expected by Tournament.jsx without external assets.
 */
export function useAudioManager() {
  const [isMuted, setIsMuted] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [volume, setVolume] = useState(0.2);

  const trackInfo = useMemo(() => {
    if (!currentTrack) return null;
    return { title: currentTrack, artist: "ambient", duration: 0 };
  }, [currentTrack]);

  const playSound = useCallback(() => {
    // Placeholder: wire to real audio if assets are added.
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleNextTrack = useCallback(() => {
    // Placeholder: rotate through a playlist when available.
    setCurrentTrack(null);
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const retryAudio = useCallback(() => {
    setAudioError(null);
  }, []);

  const handleVolumeChange = useCallback(
    (value) => {
      const next = Number.isFinite(value) ? value : volume;
      const clamped = Math.min(1, Math.max(0, next));
      setVolume(clamped);
    },
    [volume],
  );

  return {
    playSound,
    isMuted,
    handleToggleMute,
    handleNextTrack,
    isShuffle,
    handleToggleShuffle,
    currentTrack,
    trackInfo,
    audioError,
    retryAudio,
    volume,
    handleVolumeChange,
  };
}
