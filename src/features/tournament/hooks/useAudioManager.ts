import { useCallback, useMemo, useState } from "react";
import { AUDIO, STORAGE_KEYS } from "@/shared/lib/constants";
import { AudioEffects } from "@/shared/lib/sound";
import {
	getStorageString,
	isStorageAvailable,
	setStorageString,
} from "@/shared/lib/storage";

/* =========================================================================
   AUDIO MANAGER HOOK
   ========================================================================= */

interface UseAudioManagerResult {
	isMuted: boolean;
	handleToggleMute: () => void;
	playVoteSound: () => void;
	playUndoSound: () => void;
	playStreakSound: (streakSize?: number) => void;
	playLevelUpSound: () => void;
	playWowSound: () => void;
	playSurpriseSound: () => void;
}

function readStoredNumber(key: string, fallback: number): number {
	if (!isStorageAvailable()) {
		return fallback;
	}

	const rawValue = getStorageString(key);
	const parsed = rawValue ? Number.parseFloat(rawValue) : Number.NaN;
	if (Number.isNaN(parsed)) {
		return fallback;
	}
	return Math.min(1, Math.max(0, parsed));
}

function readStoredBoolean(key: string): boolean | null {
	if (!isStorageAvailable()) {
		return null;
	}

	const rawValue = getStorageString(key);
	if (rawValue === null) {
		return null;
	}
	return rawValue !== "false";
}

function writeStorage(key: string, value: string) {
	setStorageString(key, value);
}

export function useAudioManager(): UseAudioManagerResult {
	const [isMuted, setIsMuted] = useState(() => {
		const storedEnabled = readStoredBoolean(STORAGE_KEYS.SOUND_ENABLED);
		if (storedEnabled === null) {
			return false;
		}
		return !storedEnabled;
	});
	const [volume, _setVolume] = useState(() =>
		readStoredNumber(STORAGE_KEYS.EFFECTS_VOLUME, AUDIO.DEFAULT_EFFECTS_VOLUME),
	);

	const soundEffects = useMemo(
		() => ({
			playVoteSound: () => {
				if (!isMuted) {
					AudioEffects.playVote({ volume });
				}
			},
			playUndoSound: () => {
				if (!isMuted) {
					AudioEffects.playUndo({ volume });
				}
			},
			playStreakSound: (streakSize = 2) => {
				if (isMuted) {
					return;
				}
				const streakBoost = Math.min(0.28, Math.max(0, streakSize - 1) * 0.04);
				AudioEffects.playStreak({ volume: Math.min(1, volume + streakBoost) });
			},
			playLevelUpSound: () => {
				if (!isMuted) {
					AudioEffects.playLevelUp({ volume });
				}
			},
			playWowSound: () => {
				if (!isMuted) {
					AudioEffects.playWow({ volume });
				}
			},
			playSurpriseSound: () => {
				if (!isMuted) {
					AudioEffects.playSurprise({ volume });
				}
			},
		}),
		[isMuted, volume],
	);

	const handleToggleMute = useCallback(() => {
		setIsMuted((previous) => {
			const nextMuted = !previous;
			writeStorage(STORAGE_KEYS.SOUND_ENABLED, String(!nextMuted));
			return nextMuted;
		});
	}, []);

	return {
		isMuted,
		handleToggleMute,
		...soundEffects,
	};
}
