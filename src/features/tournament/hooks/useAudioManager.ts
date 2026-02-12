import { useState } from "react";

export interface UseAudioManagerResult {
	isMuted: boolean;
	handleToggleMute: () => void;
	playVoteSound: () => void;
	playUndoSound: () => void;
}

export function useAudioManager(): UseAudioManagerResult {
	const [isMuted, setIsMuted] = useState(false);

	const handleToggleMute = () => {
		setIsMuted((prev) => !prev);
	};

	const playVoteSound = () => {
		if (!isMuted) {
			// TODO: Implement sound playback
			console.log("Playing vote sound");
		}
	};

	const playUndoSound = () => {
		if (!isMuted) {
			// TODO: Implement sound playback
			console.log("Playing undo sound");
		}
	};

	return {
		isMuted,
		handleToggleMute,
		playVoteSound,
		playUndoSound,
	};
}
