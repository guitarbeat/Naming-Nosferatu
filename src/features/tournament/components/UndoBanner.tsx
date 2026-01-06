import type React from "react";
import { useEffect, useState } from "react";
import { TOURNAMENT_TIMING } from "../../../core/constants";
import Button from "../../../shared/components/Button/Button";
import styles from "../Tournament.module.css";

interface UndoBannerProps {
	undoExpiresAt: number;
	onUndo: () => void;
	onExpire: () => void;
}

export const UndoBanner: React.FC<UndoBannerProps> = ({
	undoExpiresAt,
	onUndo,
	onExpire,
}) => {
	const [remainingMs, setRemainingMs] = useState(0);

	useEffect(() => {
		// Update immediately
		const updateRemaining = () => {
			const remaining = Math.max(0, undoExpiresAt - Date.now());
			setRemainingMs(remaining);
			return remaining;
		};

		const initialRemaining = updateRemaining();
		if (initialRemaining <= 0) {
			onExpire();
			return;
		}

		const id = setInterval(() => {
			const remaining = updateRemaining();
			if (remaining <= 0) {
				onExpire();
				// Interval will be cleared by unmount or next effect run if undoExpiresAt changes (though it shouldn't for this instance)
			}
		}, TOURNAMENT_TIMING.UNDO_UPDATE_INTERVAL);

		return () => clearInterval(id);
	}, [undoExpiresAt, onExpire]);

	// If expired or invalid, don't render (though parent likely controls this too)
	if (remainingMs <= 0) return null;

	return (
		<div className={styles.undoBanner} role="status" aria-live="polite">
			<span>
				Vote recorded.
				<span className={styles.undoTimer} aria-hidden="true">
					{` ${(remainingMs / 1000).toFixed(1)}s`}
				</span>
			</span>
			<Button
				variant="primary"
				size="small"
				onClick={onUndo}
				className={styles.undoButton}
				aria-label="Undo last vote (Esc)"
			>
				Undo (Esc)
			</Button>
		</div>
	);
};
