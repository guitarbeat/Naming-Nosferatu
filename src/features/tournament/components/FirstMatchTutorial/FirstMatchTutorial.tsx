/**
 * @module FirstMatchTutorial
 * @description Tutorial overlay shown on the first match of a user's first tournament
 */

import { AnimatePresence, motion } from "framer-motion";
import { STORAGE_KEYS } from "../../../../core/constants";
import Button from "../../../../shared/components/Button/Button";
import styles from "./FirstMatchTutorial.module.css";

interface FirstMatchTutorialProps {
	isOpen: boolean;
	onClose: () => void;
}

export function FirstMatchTutorial({ isOpen, onClose }: FirstMatchTutorialProps) {
	const handleGotIt = () => {
		// Mark tutorial as seen
		const userStorage = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_STORAGE) || "{}");
		userStorage.hasSeenFirstMatchTutorial = true;
		localStorage.setItem(STORAGE_KEYS.USER_STORAGE, JSON.stringify(userStorage));
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className={styles.backdrop}
						onClick={handleGotIt}
						aria-hidden="true"
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
						className={styles.tutorialCard}
						role="dialog"
						aria-labelledby="tutorial-title"
						aria-describedby="tutorial-description"
						aria-modal="true"
					>
						<div className={styles.tutorialHeader}>
							<h2 id="tutorial-title" className={styles.tutorialTitle}>
								🎯 How to Vote
							</h2>
							<button
								type="button"
								className={styles.closeButton}
								onClick={handleGotIt}
								aria-label="Close tutorial"
							>
								×
							</button>
						</div>

						<div id="tutorial-description" className={styles.tutorialContent}>
							<div className={styles.tutorialStep}>
								<span className={styles.stepNumber}>1</span>
								<div className={styles.stepContent}>
									<p className={styles.stepTitle}>Click a name to vote for it</p>
									<p className={styles.stepDescription}>
										Choose which cat name you prefer in this matchup
									</p>
								</div>
							</div>

							<div className={styles.tutorialStep}>
								<span className={styles.stepNumber}>2</span>
								<div className={styles.stepContent}>
									<p className={styles.stepTitle}>Use keyboard shortcuts</p>
									<p className={styles.stepDescription}>
										Press <kbd>←</kbd> or <kbd>→</kbd> to select, <kbd>↑</kbd> for both,{" "}
										<kbd>↓</kbd> to skip
									</p>
								</div>
							</div>

							<div className={styles.tutorialStep}>
								<span className={styles.stepNumber}>3</span>
								<div className={styles.stepContent}>
									<p className={styles.stepTitle}>Undo if needed</p>
									<p className={styles.stepDescription}>
										You can undo your last vote within 2 seconds (or press <kbd>Esc</kbd>)
									</p>
								</div>
							</div>
						</div>

						<div className={styles.tutorialFooter}>
							<Button variant="primary" onClick={handleGotIt} className={styles.gotItButton}>
								Got it! Let's start
							</Button>
							<button
								type="button"
								className={styles.skipButton}
								onClick={handleGotIt}
								aria-label="Skip tutorial"
							>
								Skip tutorial
							</button>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
