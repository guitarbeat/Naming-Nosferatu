import { useCallback, useEffect, useRef } from "react";
import type { ToastContextType } from "@/app/providers/Providers";
import { TIMING } from "@/shared/lib/constants";
import { ratingsAPI } from "@/shared/services/supabase/ratingService";
import type { Match } from "@/shared/types";
import type { AudioManager } from "./useAudioManager";

const VOTE_COOLDOWN = TIMING.VOTE_COOLDOWN_MS;

interface UseTournamentActionsProps {
	currentMatch: Match | null;
	matchNumber: number;
	round: number;
	userName: string;
	tournamentActions: any;
	dispatch: React.Dispatch<any>;
	isVoting: boolean;
	setIsVoting: React.Dispatch<React.SetStateAction<boolean>>;
	audioManager: AudioManager;
	toast: ToastContextType;
	lastRatingsUpdateRef: React.MutableRefObject<number>;
	stateHistory: any[];
}

export function useTournamentActions({
	currentMatch,
	matchNumber,
	round,
	userName,
	tournamentActions,
	dispatch,
	isVoting,
	setIsVoting,
	audioManager,
	toast,
	lastRatingsUpdateRef,
	stateHistory,
}: UseTournamentActionsProps) {
	const handleVote = useCallback(
		(winnerId: string, loserId: string) => {
			if (!currentMatch) {
				return;
			}

			const voteTimestamp = Date.now();
			lastRatingsUpdateRef.current = voteTimestamp;

			const leftIds =
				currentMatch.mode === "2v2"
					? currentMatch.left.memberIds
					: [
							String(
								typeof currentMatch.left === "string"
									? currentMatch.left
									: currentMatch.left.id,
							),
						];
			const rightIds =
				currentMatch.mode === "2v2"
					? currentMatch.right.memberIds
					: [
							String(
								typeof currentMatch.right === "string"
									? currentMatch.right
									: currentMatch.right.id,
							),
						];

			const winnerSideIds = leftIds.includes(winnerId) ? leftIds : rightIds;
			const loserSideIds = leftIds.includes(winnerId) ? rightIds : leftIds;

			tournamentActions.recordVote(
				winnerId,
				loserId,
				winnerSideIds.length > 1 ? winnerSideIds : undefined,
				loserSideIds.length > 1 ? loserSideIds : undefined,
			);

			const winnerSide = leftIds.includes(winnerId) ? "left" : "right";
			ratingsAPI
				.applyTournamentMatch({
					userName: userName ?? "anonymous",
					leftNameIds: leftIds,
					rightNameIds: rightIds,
					winnerSide,
				})
				.catch((err: unknown) => {
					console.warn(
						"[tournament] apply_tournament_match_elo failed (non-fatal):",
						err,
					);
				});

			dispatch({
				type: "VOTE",
				payload: {
					currentMatch,
					winnerId,
					loserId,
					matchNumber,
					round,
					voteTimestamp,
					userName: userName || "anonymous",
				},
			});
		},
		[
			currentMatch,
			matchNumber,
			round,
			userName,
			tournamentActions,
			dispatch,
			lastRatingsUpdateRef,
		],
	);

	const voteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const currentMatchRef = useRef(currentMatch);

	useEffect(() => {
		currentMatchRef.current = currentMatch;
	}, [currentMatch]);

	const handleVoteWithAnimation = useCallback(
		(winnerId: string, loserId: string) => {
			if (isVoting) {
				return;
			}
			const matchAtVoteTime = currentMatchRef.current;
			setIsVoting(true);
			audioManager.playVoteSound();
			voteTimeoutRef.current = setTimeout(() => {
				// Validate match hasn't changed during animation
				if (currentMatchRef.current === matchAtVoteTime) {
					handleVote(winnerId, loserId);
				} else {
					toast.showWarning("Match changed, vote not counted");
				}
				setIsVoting(false);
			}, VOTE_COOLDOWN);
		},
		[handleVote, isVoting, audioManager, toast, setIsVoting],
	);

	useEffect(() => {
		return () => {
			if (voteTimeoutRef.current) {
				clearTimeout(voteTimeoutRef.current);
			}
		};
	}, []);

	const handleUndo = useCallback(() => {
		if (stateHistory.length === 0) {
			toast.showWarning("No more moves to undo");
			return;
		}

		const lastEntry = stateHistory[stateHistory.length - 1];
		if (!lastEntry) {
			return;
		}

		audioManager.playUndoSound();
		dispatch({
			type: "UNDO",
			payload: { lastEntry },
		});
	}, [audioManager, stateHistory, toast, dispatch]);

	const handleQuit = useCallback(() => {
		dispatch({
			type: "QUIT",
			payload: {
				defaultState: {
					matchHistory: [],
					currentRound: 1,
					currentMatch: 1,
					totalMatches: 0,
					userName: userName || "anonymous",
					lastUpdated: Date.now(),
					namesKey: "",
					ratings: {},
					mode: "1v1",
					teams: [],
					teamMatches: [],
					teamMatchIndex: 0,
					bracketEntrants: [],
				},
			},
		});
		tournamentActions.clearVoteHistory();
	}, [tournamentActions, userName, dispatch]);

	return {
		handleVote,
		handleVoteWithAnimation,
		handleUndo,
		handleQuit,
	};
}
