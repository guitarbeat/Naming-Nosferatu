import { AnimatePresence, motion } from "framer-motion";
import type { StreakBurst } from "../../types/announcements";
import { getFlameCount, getHeatTextClasses } from "../../utils/heat";

interface StreakBurstAnnouncementProps {
	prefersReducedMotion: boolean | null;
	streakBurst: StreakBurst | null;
}

export function StreakBurstAnnouncement({
	prefersReducedMotion,
	streakBurst,
}: StreakBurstAnnouncementProps) {
	return (
		<AnimatePresence>
			{streakBurst && (
				<motion.div
					key={`streak-burst-${streakBurst.key}`}
					initial={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, y: 18, scale: 0.94 }
					}
					animate={
						prefersReducedMotion
							? { opacity: 1 }
							: { opacity: 1, y: 0, scale: 1 }
					}
					exit={
						prefersReducedMotion
							? { opacity: 0 }
							: { opacity: 0, y: -18, scale: 1.03 }
					}
					transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
					className={`pointer-events-none absolute top-[20%] z-30 ${
						streakBurst.side === "left"
							? "left-3 sm:left-6"
							: "right-3 text-right sm:right-6"
					}`}
				>
					<div
						className={`rounded-2xl border px-4 py-3 shadow-[0_0_40px_rgba(249,115,22,0.35)] backdrop-blur-lg ${getHeatTextClasses(streakBurst.heatLevel)}`}
					>
						<p className="text-[10px] uppercase tracking-[0.22em] opacity-80 sm:text-xs">
							Hot streak
						</p>
						<p className="text-base font-black tracking-tight sm:text-lg">
							{streakBurst.winnerName} x{streakBurst.streak}
						</p>
						<div className="mt-2 flex gap-1.5">
							{Array.from({
								length: getFlameCount(streakBurst.streak, 9),
							}).map((_, i) => (
								<span
									key={`streak-flame-${streakBurst.key}-${i}`}
									className="h-1.5 w-5 animate-pulse rounded-full bg-current opacity-80 sm:h-2 sm:w-6"
									style={{ animationDelay: `${i * 80}ms` }}
								/>
							))}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
