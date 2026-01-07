import { useEffect, useState } from "react";
import { TOURNAMENT_TIMING } from "../../../core/constants";

export function useUndoWindow() {
	const [undoExpiresAt, setUndoExpiresAt] = useState<number | null>(null);
	const [undoStartTime, setUndoStartTime] = useState<number | null>(null);
	const canUndoNow = !!undoExpiresAt && !!undoStartTime;

	useEffect(() => {
		if (!undoExpiresAt) {
			setUndoStartTime(null);
			return;
		}

		// Set start time for CSS animation
		setUndoStartTime(Date.now());

		// Single timeout for logic cleanup
		const timeoutId = setTimeout(() => {
			setUndoExpiresAt(null);
			setUndoStartTime(null);
		}, TOURNAMENT_TIMING.UNDO_WINDOW_MS);

		return () => clearTimeout(timeoutId);
	}, [undoExpiresAt]);

	const clearUndo = () => {
		setUndoExpiresAt(null);
		setUndoStartTime(null);
	};

	return {
		undoExpiresAt,
		undoStartTime,
		canUndoNow,
		setUndoExpiresAt,
		clearUndo,
	};
}
