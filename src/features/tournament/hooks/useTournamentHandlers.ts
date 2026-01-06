/**
 * @module useTournamentHandlers
 * @description Custom hook for tournament event handlers and callbacks.
 */

import { useCallback } from "react";

interface UseTournamentHandlersProps {
	setIsProcessing: (value: boolean) => void;
	setVotingError: (error: unknown) => void;
	setShowBracket: (value: boolean | ((prev: boolean) => boolean)) => void;
	setShowKeyboardHelp: (value: boolean | ((prev: boolean) => boolean)) => void;
	setShowCatPictures: (value: boolean | ((prev: boolean) => boolean)) => void;
	getCurrentRatings?: () => Array<{ id: string | number; rating: number }> | undefined;
	existingRatings?: Record<string, number>;
	onComplete: (ratings: Record<string, number>) => void;
	audioManager: {
		handleVolumeChange: (type: "music" | "effects", value: number) => void;
	};
}

export function useTournamentHandlers({
	setIsProcessing,
	setVotingError,
	setShowBracket,
	setShowKeyboardHelp,
	setShowCatPictures,
	getCurrentRatings,
	existingRatings = {},
	onComplete,
	audioManager,
}: UseTournamentHandlersProps) {
	const handleEndEarly = useCallback(async () => {
		try {
			setIsProcessing(true);
			const currentStats = getCurrentRatings?.();
			const currentRatingsRecord = currentStats?.reduce(
				(acc, item) => {
					acc[String(item.id)] = item.rating;
					return acc;
				},
				{} as Record<string, number>,
			);

			const hasCurrent = currentRatingsRecord && Object.keys(currentRatingsRecord).length > 0;
			const fallback =
				existingRatings && Object.keys(existingRatings).length > 0 ? existingRatings : {};
			await onComplete(hasCurrent && currentRatingsRecord ? currentRatingsRecord : fallback);
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.error("Error ending tournament:", error);
			}
		} finally {
			setIsProcessing(false);
		}
	}, [getCurrentRatings, existingRatings, onComplete, setIsProcessing]);

	const handleVoteRetry = useCallback(() => {
		setVotingError(null);
	}, [setVotingError]);

	const handleDismissError = useCallback(() => {
		setVotingError(null);
	}, [setVotingError]);

	const handleToggleBracket = useCallback(() => {
		setShowBracket((prev) => !prev);
	}, [setShowBracket]);

	const handleToggleKeyboardHelp = useCallback(() => {
		setShowKeyboardHelp((prev) => !prev);
	}, [setShowKeyboardHelp]);

	const handleToggleCatPictures = useCallback(() => {
		setShowCatPictures((prev) => !prev);
	}, [setShowCatPictures]);

	const handleVolumeChange = useCallback(
		(type: "music" | "effects", value: number) => {
			audioManager.handleVolumeChange(type, value);
		},
		[audioManager],
	);

	return {
		handleEndEarly,
		handleVoteRetry,
		handleDismissError,
		handleToggleBracket,
		handleToggleKeyboardHelp,
		handleToggleCatPictures,
		handleVolumeChange,
	};
}
