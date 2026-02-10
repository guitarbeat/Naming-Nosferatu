import { useState } from "react";

/* =========================================================================
   INTERACTION HOOKS
   ========================================================================= */

export function useAudioManager() {
	const [isMuted, setIsMuted] = useState(true);
	const [volume, setVolume] = useState(0.2);
	return {
		playAudioTrack: () => {
			/* No-op: handled by external audio services if available */
		},
		isMuted,
		handleToggleMute: () => setIsMuted((p) => !p),
		handleNextTrack: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		isShuffle: false,
		handleToggleShuffle: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		currentTrack: null,
		trackInfo: null,
		audioError: null,
		retryAudio: () => {
			/* No-op: handled by external audio services if available */
		},
		volume,
		handleVolumeChange: (_unused: unknown, v: number) => setVolume(Math.min(1, Math.max(0, v))),
	};
}
