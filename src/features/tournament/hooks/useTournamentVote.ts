import { useCallback, useState } from "react";
import { useToast } from "@/providers/Providers";
import type { UseAudioManagerResult } from "./useAudioManager";
import type { UseTournamentStateResult } from "./useTournamentState";

const VOTE_COOLDOWN = 300;

export interface UseTournamentVoteResult {
	isVoting: boolean;
	handleVoteWithAnimation: (winnerId: string, loserId: string) => void;
	handleUndoWithAnimation: () => void;
}

interface UseTournamentVoteProps {
	tournamentState: UseTournamentStateResult;
	audioManager: UseAudioManagerResult;
	onVote?: (winnerId: string, loserId: string) => void;
}

export function useTournamentVote({
	tournamentState,
	audioManager,
	onVote,
}: UseTournamentVoteProps): UseTournamentVoteResult {
	const [isVoting, setIsVoting] = useState(false);
	const { showError } = useToast();

	const handleVoteWithAnimation = useCallback(
		(winnerId: string, loserId: string) => {
			if (isVoting) {
				return;
			}

			setIsVoting(true);
			audioManager.playVoteSound();

			setTimeout(() => {
				tournamentState.handleVote(winnerId, loserId);
				onVote?.(winnerId, loserId);
				setIsVoting(false);
			}, VOTE_COOLDOWN);
		},
		[isVoting, audioManager, tournamentState, onVote],
	);

	const handleUndoWithAnimation = useCallback(() => {
		if (!tournamentState.canUndo) {
			showError("No more moves to undo");
			return;
		}

		audioManager.playUndoSound();
		tournamentState.handleUndo();
	}, [tournamentState, audioManager, showError]);

	return {
		isVoting,
		handleVoteWithAnimation,
		handleUndoWithAnimation,
	};
}
