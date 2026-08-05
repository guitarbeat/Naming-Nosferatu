import { type KeyboardEvent, useCallback } from "react";

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

interface UseTournamentKeyboardOptions {
	onVoteForSide: (side: "left" | "right") => void;
	onUndo: () => void;
	onQuit: () => void;
	canUndo: boolean;
	isVoting: boolean;
	isOpeningReveal: boolean;
}

export function useTournamentKeyboard({
	onVoteForSide,
	onUndo,
	onQuit,
	canUndo,
	isVoting,
	isOpeningReveal,
}: UseTournamentKeyboardOptions) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>, side: "left" | "right") => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onVoteForSide(side);
			}
		},
		[onVoteForSide],
	);

	const handleGlobalKeyDown = useCallback(
		(event: globalThis.KeyboardEvent) => {
			if (isInteractiveTarget(event.target)) {
				return;
			}
			if (isVoting || isOpeningReveal) {
				return;
			}

			const key = event.key.toLowerCase();
			if (key === "1" || key === "arrowleft") {
				event.preventDefault();
				onVoteForSide("left");
			} else if (key === "2" || key === "arrowright") {
				event.preventDefault();
				onVoteForSide("right");
			} else if (key === "u" && canUndo) {
				event.preventDefault();
				onUndo();
			} else if (key === "q") {
				event.preventDefault();
				onQuit();
			}
		},
		[isVoting, isOpeningReveal, onVoteForSide, canUndo, onUndo, onQuit],
	);

	return { handleKeyDown, handleGlobalKeyDown };
}
