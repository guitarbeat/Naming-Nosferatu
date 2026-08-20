import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect } from "react";
import type { MatchSideData } from "../utils/matchHelpers";

interface UseTournamentKeyboardProps {
	isComplete: boolean;
	matchData: MatchSideData | null;
	isVoting: boolean;
	openingBracketReveal: boolean;
	canUndo: boolean;
	handleUndo: () => void;
	handleVoteForSide: (side: "left" | "right") => void;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}
	const tagName = target.tagName;
	return (
		tagName === "INPUT" ||
		tagName === "TEXTAREA" ||
		tagName === "SELECT" ||
		target.isContentEditable
	);
}

export function useTournamentKeyboard({
	isComplete,
	matchData,
	isVoting,
	openingBracketReveal,
	canUndo,
	handleUndo,
	handleVoteForSide,
}: UseTournamentKeyboardProps) {
	const handleGlobalKeyDown = useCallback(
		(event: globalThis.KeyboardEvent) => {
			if (
				isVoting ||
				openingBracketReveal ||
				isInteractiveTarget(event.target) ||
				event.metaKey ||
				event.ctrlKey ||
				event.altKey
			) {
				return;
			}

			const key = event.key.toLowerCase();
			if (key === "arrowleft" || key === "a") {
				event.preventDefault();
				handleVoteForSide("left");
				return;
			}
			if (key === "arrowright" || key === "d") {
				event.preventDefault();
				handleVoteForSide("right");
				return;
			}
			if ((key === "u" || key === "backspace") && canUndo) {
				event.preventDefault();
				handleUndo();
			}
		},
		[isVoting, openingBracketReveal, handleVoteForSide, canUndo, handleUndo],
	);

	useEffect(() => {
		if (isComplete || !matchData) {
			return;
		}

		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, [isComplete, matchData, handleGlobalKeyDown]);

	const handleKeyDown = useCallback(
		(event: ReactKeyboardEvent<HTMLElement>, side: "left" | "right") => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleVoteForSide(side);
			}
		},
		[handleVoteForSide],
	);

	return { handleKeyDown, handleGlobalKeyDown };
}
