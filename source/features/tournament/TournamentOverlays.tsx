import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import Button from "../../shared/components/Button";
import Card from "../../shared/components/Card";
import styles from "../tournament.module.css";

export const KeyboardHelp = memo(({ show }: { show: boolean }) => (
    <AnimatePresence>
        {show && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={styles.keyboardHelp}>
                <h3 className={styles.modalTitle}>Shortcuts</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    <li><kbd>←</kbd> Select Left</li>
                    <li><kbd>→</kbd> Select Right</li>
                    <li><kbd>↑</kbd> Both</li>
                    <li><kbd>↓</kbd> Neither</li>
                    <li><kbd>C</kbd> Toggle Cats</li>
                </ul>
            </motion.div>
        )}
    </AnimatePresence>
));

export const UndoBanner = memo(({ undoExpiresAt, undoStartTime, onUndo }: any) => {
    if (!undoExpiresAt || !undoStartTime) return null;
    return (
        <div className={styles.undoBanner} role="status">
            <div className={styles.undoBannerContent}><span>Choice made.</span></div>
            <Button variant="primary" size="small" onClick={onUndo} className={styles.undoButton}>Undo (Esc)</Button>
        </div>
    );
});

export const MatchResult = memo(({ showMatchResult, lastMatchResult }: any) => (
    <AnimatePresence>
        {showMatchResult && lastMatchResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed right-8 bottom-8 z-[1000] p-6 text-white bg-purple-600 rounded-lg shadow-lg">
                🏆 {lastMatchResult}
            </motion.div>
        )}
    </AnimatePresence>
));

export const RoundTransition = memo(({ showRoundTransition, nextRoundNumber }: any) => (
    <AnimatePresence>
        {showRoundTransition && nextRoundNumber && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80">
                <div className="text-center">
                    <div className="text-7xl mb-4">🏆</div>
                    <h2 className="text-4xl font-bold text-white">Round {nextRoundNumber}</h2>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
));

export const FirstMatchTutorial = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Card className="max-w-md p-8 text-center bg-slate-900 border border-white/10 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-4 text-white">Welcome to the Judge's Seat!</h2>
                    <p className="mb-6 text-slate-300">Select your favorite name by clicking or using arrow keys. You can also vote for both or skip.</p>
                    <Button onClick={onClose} variant="primary">Got it!</Button>
                </Card>
            </motion.div>
        )}
    </AnimatePresence>
));
