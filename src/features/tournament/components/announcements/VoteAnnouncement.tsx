import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface VoteAnnouncementProps {
	prefersReducedMotion: boolean | null;
	voteAnnouncement: string | null;
	currentMatchKey: string;
}

export function VoteAnnouncement({
	prefersReducedMotion,
	voteAnnouncement,
	currentMatchKey,
}: VoteAnnouncementProps) {
	return (
		<AnimatePresence>
			{voteAnnouncement && (
				<motion.div
					key={`${voteAnnouncement}-${currentMatchKey}`}
					initial={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, y: -16, scale: 0.95 }
					}
					animate={
						prefersReducedMotion
							? { opacity: 1 }
							: { opacity: 1, y: 0, scale: 1 }
					}
					exit={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, y: -20, scale: 0.98 }
					}
					transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
					className="pointer-events-none absolute left-1/2 top-2 z-30 w-[calc(100%-1.5rem)] max-w-full -translate-x-1/2 sm:w-auto"
				>
					<div className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-md sm:px-4">
						<div className="flex items-center gap-2 text-emerald-100">
							<Trophy className="size-4 text-emerald-300" />
							<span className="truncate text-xs font-bold tracking-wide sm:text-sm">
								{voteAnnouncement} advances
							</span>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
