import { AnimatePresence, motion } from "framer-motion";
import { Command, X } from "lucide-react";
import { useEffect } from "react";
import styles from "./KeyboardShortcutsOverlay.module.css";

interface Shortcut {
	keys: string[];
	description: string;
}

const SHORTCUTS: Shortcut[] = [
	{ keys: ["?"], description: "Show keyboard shortcuts" },
	{ keys: ["/"], description: "Vote (Home)" },
	{ keys: ["r"], description: "Go to Results" },
	{ keys: ["a"], description: "Go to Analysis" },
	{ keys: ["g"], description: "Go to Gallery" },
	{ keys: ["Esc"], description: "Close modal" },
];

interface KeyboardShortcutsOverlayProps {
	isOpen: boolean;
	onClose: () => void;
}

export function KeyboardShortcutsOverlay({ isOpen, onClose }: KeyboardShortcutsOverlayProps) {
	// Close on Esc
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isOpen && e.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className={styles.overlay}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				>
					<motion.div
						className={styles.modal}
						initial={{ scale: 0.95, opacity: 0, y: 10 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.95, opacity: 0, y: 10 }}
						onClick={(e) => e.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-labelledby="shortcuts-title"
					>
						<div className={styles.header}>
							<h2 id="shortcuts-title" className={styles.title}>
								<Command size={20} />
								Keyboard Shortcuts
							</h2>
							<button onClick={onClose} className={styles.closeBtn} aria-label="Close">
								<X size={20} />
							</button>
						</div>

						<div className={styles.shortcutGrid}>
							{SHORTCUTS.map((shortcut) => (
								<div key={shortcut.description} className={styles.shortcutRow}>
									<span className={styles.description}>{shortcut.description}</span>
									<div className={styles.keys}>
										{shortcut.keys.map((key) => (
											<span key={key} className={styles.key}>
												{key}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
