import { AnimatePresence, motion } from "framer-motion";

interface RoundAnnouncementProps {
	prefersReducedMotion: boolean | null;
	roundAnnouncement: number | null;
}

export function RoundAnnouncement({
	prefersReducedMotion,
	roundAnnouncement,
}: RoundAnnouncementProps) {
	return (
		<AnimatePresence>
			{roundAnnouncement !== null && (
				<motion.div
					key={`round-announcement-${roundAnnouncement}`}
					initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
					animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
					exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
					transition={{ duration: prefersReducedMotion ? 0.01 : 0.35 }}
					className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4"
				>
					<motion.div
						initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.85, y: 8 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.7, y: -6 }}
						transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
						className="relative overflow-hidden rounded-2xl border border-primary/35 bg-slate-900/80 px-5 py-5 text-center shadow-[0_0_80px_rgba(39,135,153,0.25)] backdrop-blur-xl sm:px-8 sm:py-6"
					>
						<div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-chart-4/20" />
						<div className="relative">
							<p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-primary/70 sm:text-xs sm:tracking-[0.3em]">
								Next stage
							</p>
							<p className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
								Round {roundAnnouncement}
							</p>
							<p className="mt-1 text-xs text-white/72 sm:text-sm">
								New head-to-head matchups ready
							</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
