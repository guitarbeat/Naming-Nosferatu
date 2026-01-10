import { AnimatePresence, motion } from "framer-motion";
import styles from "./KeyboardHelp.module.css";

interface KeyboardHelpProps {
	show: boolean;
}

export function KeyboardHelp({ show }: KeyboardHelpProps) {
	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
					id="keyboardHelp"
					className={styles.keyboardHelp}
					role="complementary"
					aria-label="Keyboard shortcuts help"
				>
					<h3 className={styles.title}>Keyboard Shortcuts</h3>
					<ul className={styles.list}>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>←</kbd>
							Select left name
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>→</kbd>
							Select right name
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>↑</kbd>
							Vote for both names
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>↓</kbd>
							Skip this match
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>Space</kbd>
							or
							<kbd className={styles.kbd}>Enter</kbd>
							Vote for selected name
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>Escape</kbd>
							Clear selection
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>Tab</kbd>
							Navigate between elements
						</li>
						<li className={styles.listItem}>
							<kbd className={styles.kbd}>C</kbd>
							Toggle cat pictures
						</li>
					</ul>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
