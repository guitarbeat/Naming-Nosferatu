import { useEffect, useState } from "react";
import { STORAGE_KEYS, TOURNAMENT_TIMING } from "../../../core/constants";
import Button from "../../../shared/components/Button";
import undoStyles from "../styles/Tournament.module.css";

interface UndoBannerProps {
	undoExpiresAt: number | null;
	undoStartTime: number | null;
	onUndo: () => void;
}

export function UndoBanner({ undoExpiresAt, undoStartTime, onUndo }: UndoBannerProps) {
	const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);

	useEffect(() => {
		if (!undoExpiresAt || !undoStartTime) {
			return;
		}

		// Check if this is the first time user sees undo banner
		const hasSeenUndo = localStorage.getItem(STORAGE_KEYS.USER_STORAGE)
			? JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_STORAGE) || "{}")?.hasSeenUndoBanner
			: false;

		if (!hasSeenUndo) {
			setShowFirstTimeHint(true);
			// Mark as seen after 3 seconds
			const timer = setTimeout(() => {
				setShowFirstTimeHint(false);
				const userStorage = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_STORAGE) || "{}");
				userStorage.hasSeenUndoBanner = true;
				localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify(userStorage));
			}, 3000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [undoExpiresAt, undoStartTime]);

	if (!undoExpiresAt || !undoStartTime) {
		return null;
	}

	const timeRemaining =
		undoExpiresAt && undoStartTime
			? `${((undoExpiresAt - Date.now()) / 1000).toFixed(1)}s`
			: "0.0s";

	return (
		<div className={undoStyles.undoBanner} role="status" aria-live="polite">
			<div className={undoStyles.undoBannerContent}>
				<span>
					Choice made.
					<span
						className={undoStyles.undoTimer}
						aria-hidden="true"
						style={{
							animation: `undoProgress ${TOURNAMENT_TIMING.UNDO_WINDOW_MS}ms linear forwards`,
						}}
					>
						{" "}
						{timeRemaining}
					</span>
				</span>
				{showFirstTimeHint && (
					<span className={undoStyles.undoFirstTimeHint} role="note">
						💡 You can undo your last vote if you change your mind!
					</span>
				)}
			</div>
			<Button
				variant="primary"
				size="small"
				onClick={onUndo}
				className={undoStyles.undoButton}
				aria-label="Undo last vote (Esc)"
			>
				Undo (Esc)
			</Button>
		</div>
	);
}
