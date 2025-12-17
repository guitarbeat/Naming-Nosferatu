import { useCallback, useMemo, useState } from "react";

const DEFAULT_TRACKS = [
  { name: "Synthwave Pulse" },
  { name: "Lo-fi Circuit" },
  { name: "Neon Drift" },
];

export function useAudioManager() {
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [audioError, setAudioError] = useState(null);
  const [volume, setVolume] = useState({ music: 0.7, effects: 0.7 });

  const currentTrack = useMemo(
    () => DEFAULT_TRACKS[currentTrackIndex % DEFAULT_TRACKS.length],
    [currentTrackIndex],
  );

  const trackInfo = useMemo(() => currentTrack, [currentTrack]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const handleNextTrack = useCallback(() => {
    setAudioError(null);
    setCurrentTrackIndex((prev) => {
      if (isShuffle) {
        const next = Math.floor(Math.random() * DEFAULT_TRACKS.length);
        return next;
      }
      return (prev + 1) % DEFAULT_TRACKS.length;
    });
  }, [isShuffle]);

  const handleVolumeChange = useCallback((channel, value) => {
    setVolume((prev) => ({
      ...prev,
      [channel]: Number.isFinite(value) ? value : prev[channel],
    }));
  }, []);

  const playSound = useCallback(() => {
    // Placeholder: actual audio playback was removed; keep interface stable.
  }, []);

  const retryAudio = useCallback(() => {
    setAudioError(null);
  }, []);

  return {
    isMuted,
    isShuffle,
    currentTrack,
    trackInfo,
    audioError,
    volume,
    handleToggleMute,
    handleToggleShuffle,
    handleNextTrack,
    handleVolumeChange,
    playSound,
    retryAudio,
  };
}
