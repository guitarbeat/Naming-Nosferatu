/**
 * @module FirstMatchTutorial
 * @description Minimal inline hint shown on the first match - replaces modal with contextual tooltip
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../../core/constants";
import styles from "./FirstMatchTutorial.module.css";

interface FirstMatchTutorialProps {
	isOpen: boolean;
	onClose: () => void;
}

export function FirstMatchTutorial({ isOpen, onClose }: FirstMatchTutorialProps) {
	const [showKeyboardHint, setShowKeyboardHint] = useState(false);

	const handleDismiss = useCallback(() => {
		// Mark tutorial as seen
		const userStorage = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_STORAGE) || "{}");
		userStorage.hasSeenFirstMatchTutorial = true;
		localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify(userStorage));
		onClose();
	}, [onClose]);

	// Show keyboard hint after a delay (progressive disclosure)
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => setShowKeyboardHint(true), 2000);
			return () => clearTimeout(timer);
		}
		setShowKeyboardHint(false);
		return undefined;
	}, [isOpen]);

	// Auto-dismiss after 8 seconds of no interaction
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(handleDismiss, 8000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [isOpen, handleDismiss]);

	if (!isOpen) {
		return null;
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Subtle backdrop - click anywhere to dismiss */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className={styles.inlineBackdrop}
						onClick={handleDismiss}
						aria-hidden="true"
					/>

					{/* Floating hint tooltip */}
					<motion.div
						initial={{ opacity: 0, y: 10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -10, scale: 0.95 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className={styles.inlineHint}
						role="tooltip"
						aria-live="polite"
					>
						<span className={styles.hintIcon}>👆</span>
						<span className={styles.hintText}>Tap your favorite name</span>

						{/* Progressive keyboard hint */}
						<AnimatePresence>
							{showKeyboardHint && (
								<motion.span
									initial={{ opacity: 0, x: -5 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0 }}
									className={styles.keyboardHint}
								>
									or use <kbd>←</kbd> <kbd>→</kbd>
								</motion.span>
							)}
						</AnimatePresence>

						<button
							type="button"
							className={styles.dismissButton}
							onClick={handleDismiss}
							aria-label="Dismiss hint"
						>
							✓
						</button>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
