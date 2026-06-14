import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface NameSelectorActionsProps {
	selectedCount: number;
	onStartTournament: () => void;
	isSwipeMode: boolean;
}

export function NameSelectorActions({
	selectedCount,
	onStartTournament,
	isSwipeMode,
}: NameSelectorActionsProps) {
	if (selectedCount < 2) {
		return null;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 20 }}
			className={`fixed bottom-[max(env(safe-area-inset-bottom)+5rem,7rem)] sm:bottom-28 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none ${
				isSwipeMode ? "translate-y-[-2rem] sm:translate-y-0" : ""
			}`}
		>
			<motion.button
				type="button"
				onClick={onStartTournament}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className="pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(39,135,153,0.35)] ring-1 ring-white/20 backdrop-blur-md"
			>
				<div className="relative">
					<Trophy className="size-5" />
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						key={selectedCount}
						className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm ring-2 ring-primary"
					>
						{selectedCount}
					</motion.span>
				</div>
				<span className="font-bold tracking-wide">Start Tournament</span>
			</motion.button>
		</motion.div>
	);
}
