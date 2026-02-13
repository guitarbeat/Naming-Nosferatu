import { useCallback, useState } from "react";
import { useToast } from "@/providers/Providers";
import type { UseAudioManagerResult } from "./useAudioManager";
import type { UseTournamentStateResult } from "./useTournamentState";

const VOTE_COOLDOWN = 300;

export interface UseTournamentVoteResult {
	isVoting: boolean;
	handleVoteWithAnimation: (winnerIdOrSide: string, loserId?: string) => void;
	handleUndoWithAnimation: () => void;
}

interface UseTournamentVoteProps {
	tournamentState?: UseTournamentStateResult;
	audioManager: UseAudioManagerResult;
	onVote?: (winnerId: string, loserId: string) => void;
	isProcessing?: boolean;
	isTransitioning?: boolean;
	currentMatch?: unknown;
	handleVote?: unknown;
	setIsProcessing?: (v: boolean) => void;
	setIsTransitioning?: (v: boolean) => void;
	setSelectedOption?: (v: "left" | "right" | null) => void;
	setVotingError?: (v: unknown) => void;
	setLastMatchResult?: (v: string | null) => void;
	setShowMatchResult?: (v: boolean) => void;
	showSuccess?: unknown;
	showError?: unknown;
}

export function useTournamentVote({
	tournamentState,
	audioManager,
	onVote,
	setIsProcessing,
	setIsTransitioning,
	setSelectedOption,
    handleVote, // Capture handleVote passed from parent if needed, but tournamentState usually has it
}: UseTournamentVoteProps): UseTournamentVoteResult {
	const [isVotingLocal, setIsVotingLocal] = useState(false);
	const isVoting = isVotingLocal;

	const setVoting = useCallback((val: boolean) => {
		setIsVotingLocal(val);
		setIsProcessing?.(val);
	}, [setIsProcessing]);

	const toast = useToast();

    // Fallback if tournamentState is not provided (legacy usage?)
    const actualHandleVote = tournamentState?.handleVote || (handleVote as any);
    const actualCanUndo = tournamentState?.canUndo ?? false;
    const actualHandleUndo = tournamentState?.handleUndo;
    const actualCurrentMatch = tournamentState?.currentMatch;

	const handleVoteWithAnimation = useCallback(
		(winnerIdOrSide: string, loserId?: string) => {
			if (isVoting) {
				return;
			}

			// Handle both "left"/"right" (single param) and direct IDs (two params)
			let winnerId: string;
			let loserIdFinal: string;
			let side: "left" | "right" | null = null;

			if (loserId === undefined) {
				// Single parameter mode: "left" or "right"
				if (!actualCurrentMatch) {
					return;
				}
				
				side = winnerIdOrSide as "left" | "right";
				if (side === "left") {
					winnerId = String(typeof actualCurrentMatch.left === 'object' ? actualCurrentMatch.left.id : actualCurrentMatch.left);
					loserIdFinal = String(typeof actualCurrentMatch.right === 'object' ? actualCurrentMatch.right.id : actualCurrentMatch.right);
				} else {
					winnerId = String(typeof actualCurrentMatch.right === 'object' ? actualCurrentMatch.right.id : actualCurrentMatch.right);
					loserIdFinal = String(typeof actualCurrentMatch.left === 'object' ? actualCurrentMatch.left.id : actualCurrentMatch.left);
				}
				
				if (setSelectedOption) {
					setSelectedOption(side);
				}
			} else {
				// Two parameter mode: direct IDs
				winnerId = winnerIdOrSide;
				loserIdFinal = loserId;
				
				const isLeft = actualCurrentMatch && (
					(typeof actualCurrentMatch.left === 'object' ? actualCurrentMatch.left.id : actualCurrentMatch.left) === winnerId
				);
				
				if (setSelectedOption && actualCurrentMatch) {
					setSelectedOption(isLeft ? "left" : "right");
				}
			}

            if (setIsTransitioning) {
                setIsTransitioning(true);
            }

			setVoting(true);
			audioManager.playVoteSound();

			setTimeout(() => {
				actualHandleVote?.(winnerId, loserIdFinal);
				onVote?.(winnerId, loserIdFinal);
				setVoting(false);
                if (setIsTransitioning) setIsTransitioning(false);
                if (setSelectedOption) setSelectedOption(null);
			}, VOTE_COOLDOWN);
		},
		[isVoting, audioManager, actualHandleVote, onVote, setVoting, setIsTransitioning, setSelectedOption, actualCurrentMatch],
	);

	const handleUndoWithAnimation = useCallback(() => {
		if (!actualCanUndo) {
			toast.showWarning("No more moves to undo");
			return;
		}

		audioManager.playUndoSound();
		actualHandleUndo?.();
	}, [actualCanUndo, actualHandleUndo, audioManager, toast]);

	return {
		isVoting,
		handleVoteWithAnimation,
		handleUndoWithAnimation,
	};
}
