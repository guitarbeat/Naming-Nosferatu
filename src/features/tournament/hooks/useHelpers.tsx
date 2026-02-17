/**
 * @module useHelpers
 * @description Consolidated tournament helper hooks
 */

import { useCallback, useState } from "react";
import {
	getCurrentTrack,
	playBackgroundMusic,
	playLevelUpSound,
	playNextTrack,
	playPreviousTrack,
	playSound,
	playSurpriseSound,
	playWowSound,
	setBackgroundMusicVolume,
	stopBackgroundMusic,
} from "@/shared/lib/sound";

/* =========================================================================
   AUDIO MANAGER HOOK
   ========================================================================= */

export interface UseAudioManagerResult {
	isMuted: boolean;
	handleToggleMute: () => void;
	playVoteSound: () => void;
	playUndoSound: () => void;
	volume: number;
	handleVolumeChange: (_unused: unknown, v: number) => void;
	playAudioTrack: () => void;
	handleNextTrack: () => void;
	handlePreviousTrack: () => void;
	isShuffle: boolean;
	handleToggleShuffle: () => void;
	currentTrack: string;
	trackInfo: null;
	audioError: null;
	retryAudio: () => void;
	backgroundMusicEnabled: boolean;
	toggleBackgroundMusic: () => void;
	backgroundMusicVolume: number;
	handleBackgroundMusicVolumeChange: (volume: number) => void;
	playLevelUpSound: () => void;
	playWowSound: () => void;
	playSurpriseSound: () => void;
}

export function useAudioManager(): UseAudioManagerResult {
	const [isMuted, setIsMuted] = useState(false);
	const [volume, setVolume] = useState(0.3);
	const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false);
	const [backgroundMusicVolume, setBackgroundMusicVolumeState] = useState(0.1);

	const playVoteSound = useCallback(() => {
		if (!isMuted) {
			playSound("vote", { volume });
		}
	}, [isMuted, volume]);

	const playUndoSound = useCallback(() => {
		if (!isMuted) {
			playSound("undo", { volume });
		}
	}, [isMuted, volume]);

	const playLevelUpEffect = useCallback(() => {
		if (!isMuted) {
			playLevelUpSound({ volume });
		}
	}, [isMuted, volume]);

	const playWowEffect = useCallback(() => {
		if (!isMuted) {
			playWowSound({ volume });
		}
	}, [isMuted, volume]);

	const playSurpriseEffect = useCallback(() => {
		if (!isMuted) {
			playSurpriseSound({ volume });
		}
	}, [isMuted, volume]);

	const handleVolumeChange = useCallback((_unused: unknown, v: number) => {
		const newVolume = Math.min(1, Math.max(0, v));
		setVolume(newVolume);
	}, []);

	const toggleBackgroundMusic = useCallback(() => {
		if (backgroundMusicEnabled) {
			stopBackgroundMusic();
		} else {
			playBackgroundMusic();
		}
		setBackgroundMusicEnabled(!backgroundMusicEnabled);
	}, [backgroundMusicEnabled]);

	const handleBackgroundMusicVolumeChange = useCallback((volume: number) => {
		const newVolume = Math.min(1, Math.max(0, volume));
		setBackgroundMusicVolumeState(newVolume);
		setBackgroundMusicVolume(newVolume);
	}, []);

	const handleNextTrack = useCallback(() => {
		playNextTrack();
	}, []);

	const handlePreviousTrack = useCallback(() => {
		playPreviousTrack();
	}, []);

	return {
		playAudioTrack: () => {
			/* No-op: handled by external audio services if available */
		},
		isMuted,
		handleToggleMute: () => setIsMuted((p) => !p),
		handleNextTrack,
		handlePreviousTrack,
		isShuffle: false,
		handleToggleShuffle: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		currentTrack: getCurrentTrack(),
		trackInfo: null,
		audioError: null,
		retryAudio: () => {
			/* No-op: handled by external audio services if available */
		},
		volume,
		handleVolumeChange,
		playVoteSound,
		playUndoSound,
		backgroundMusicEnabled,
		toggleBackgroundMusic,
		backgroundMusicVolume,
		handleBackgroundMusicVolumeChange,
		playLevelUpSound: playLevelUpEffect,
		playWowSound: playWowEffect,
		playSurpriseSound: playSurpriseEffect,
	};
}
