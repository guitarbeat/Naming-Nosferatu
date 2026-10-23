import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { memo } from "react";
import { BracketTree } from "@/components/ui/TournamentHeader";
import { MOTION_DURATIONS } from "@/lib/uiUtils";
import { getFlameCount, getHeatTextClasses, type HeatLevel } from "@/tournament/tournamentEngine";

export interface StreakBurst {
	key: number;
	side: "left" | "right";
	winnerName: string;
	streak: number;
	heatLevel: HeatLevel;
}

export interface TournamentAnnouncementsProps {
	prefersReducedMotion: boolean | null;
	openingBracketReveal: boolean;
	openingEntrants: Array<{ id: string; label: string }>;
	tournamentMode: string;
	totalRounds: number;
	voteAnnouncement: string | null;
	currentMatchKey: string;
	streakBurst: StreakBurst | null;
	roundAnnouncement: number | null;
}

// ⚡ Bolt Performance Optimization: Wrapped TournamentAnnouncements in React.memo()
// Prevents unnecessary re-renders of complex Framer Motion animations when parent tournament states
// (like timers or user input events) change without affecting announcement states.
export const TournamentAnnouncements = memo(function TournamentAnnouncements({
	prefersReducedMotion,
	openingBracketReveal,
	openingEntrants,
	tournamentMode,
	totalRounds,
	voteAnnouncement,
	currentMatchKey,
	streakBurst,
	roundAnnouncement,
}: TournamentAnnouncementsProps) {
	return (
		<>
			<div className="sr-only" aria-live="polite">
				{openingBracketReveal && "The bracket is set. First match begins now."}
				{roundAnnouncement !== null && `Round ${roundAnnouncement} begins.`}
				{voteAnnouncement && `${voteAnnouncement} advances.`}
				{streakBurst && `${streakBurst.winnerName} is on a ${streakBurst.streak} win streak.`}
			</div>

			<AnimatePresence>
				{openingBracketReveal && openingEntrants.length > 1 && (
					<motion.div
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, scale: 1.03, filter: "blur(6px)" }
						}
						transition={{
							duration: prefersReducedMotion ? MOTION_DURATIONS.reducedMotionDuration : 0.42,
						}}
						className="absolute inset-0 z-40 flex items-center justify-center px-3 sm:px-6"
					>
						<div className="absolute inset-0 bg-white/80 backdrop-blur-md" />
						<motion.div
							initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
							exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
							transition={{
								duration: prefersReducedMotion
									? MOTION_DURATIONS.reducedMotionDuration
									: MOTION_DURATIONS.moderate,
							}}
							className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card p-5 shadow-[0_30px_90px_rgba(0,0,0,0.1)] sm:p-8"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
							<div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<p className="text-[10px] font-semibold tracking-wide text-primary/80">
										Bracket Reveal
									</p>
									<h3 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
										The field is set
									</h3>
									<p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
										{tournamentMode === "2v2"
											? "Teams have been assigned. Review the bracket before match 1 begins."
											: "Contenders are seeded. Voting starts with match 1."}
									</p>
								</div>
								<div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-foreground">
									<Trophy className="size-3.5 text-primary" />
									<span>{openingEntrants.length} contenders</span>
									<span className="h-1 w-1 rounded-full bg-primary/30" />
									<span>{totalRounds} rounds</span>
								</div>
							</div>

							<div className="relative">
								<div className="mb-4">
									<BracketTree round={1} totalRounds={totalRounds} />
								</div>
								<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
									{openingEntrants.slice(0, 8).map((entrant, index) => (
										<motion.div
											key={`opening-entrant-${entrant.id}`}
											initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
											animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
											transition={{
												duration: prefersReducedMotion
													? MOTION_DURATIONS.reducedMotionDuration
													: MOTION_DURATIONS.base,
												delay: prefersReducedMotion ? 0 : 0.12 + index * 0.06,
											}}
											className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-background/50 px-4 py-4"
										>
											<div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary via-accent to-chart-4" />
											<p className="pl-3 text-[10px] font-semibold tracking-wide text-muted-foreground">
												Seed {index + 1}
											</p>
											<p className="pl-3 pt-2 font-display text-xl leading-tight text-foreground sm:text-2xl">
												{entrant.label}
											</p>
										</motion.div>
									))}
								</div>
								{openingEntrants.length > 8 && (
									<p className="mt-4 text-center text-xs tracking-wide text-muted-foreground">
										+ {openingEntrants.length - 8} more contenders in bracket
									</p>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{voteAnnouncement && (
					<div className="pointer-events-none absolute left-1/2 top-2 z-30 flex w-[calc(100%-1.5rem)] max-w-full -translate-x-1/2 justify-center sm:w-auto">
						<motion.div
							key={`${voteAnnouncement}-${currentMatchKey}`}
							initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
							exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
							transition={{
								duration: prefersReducedMotion
									? MOTION_DURATIONS.reducedMotionDuration
									: MOTION_DURATIONS.base,
							}}
							className="w-full sm:w-auto"
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
					</div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{streakBurst && (
					<motion.div
						key={`streak-burst-${streakBurst.key}`}
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
						exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 1.03 }}
						transition={{
							duration: prefersReducedMotion
								? MOTION_DURATIONS.reducedMotionDuration
								: MOTION_DURATIONS.base,
						}}
						className={`pointer-events-none absolute top-[20%] z-30 ${
							streakBurst.side === "left" ? "left-3 sm:left-6" : "right-3 text-right sm:right-6"
						}`}
					>
						<div
							className={`rounded-2xl border px-4 py-3 shadow-[0_0_40px_rgba(249,115,22,0.35)] backdrop-blur-lg ${getHeatTextClasses(streakBurst.heatLevel)}`}
						>
							<p className="text-[10px] tracking-wide opacity-80 sm:text-xs">Hot streak</p>
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

			<AnimatePresence>
				{roundAnnouncement !== null && (
					<motion.div
						key={`round-announcement-${roundAnnouncement}`}
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
						exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
						transition={{
							duration: prefersReducedMotion
								? MOTION_DURATIONS.reducedMotionDuration
								: MOTION_DURATIONS.moderate,
						}}
						className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4"
					>
						<motion.div
							initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.85, y: 8 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
							exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.7, y: -6 }}
							transition={{
								duration: prefersReducedMotion
									? MOTION_DURATIONS.reducedMotionDuration
									: MOTION_DURATIONS.base,
							}}
							className="relative overflow-hidden rounded-[2rem] border border-primary/35 bg-card px-5 py-5 text-center shadow-[0_0_80px_var(--primary)] backdrop-blur-xl sm:px-8 sm:py-6"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-chart-4/10" />
							<div className="relative">
								<p className="mb-2 text-[11px] tracking-wide text-primary/80 sm:text-xs sm:tracking-[0.3em]">
									Next stage
								</p>
								<p className="text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
									Round {roundAnnouncement}
								</p>
								<p className="mt-1 text-xs text-muted-foreground sm:text-sm">
									New head-to-head matchups ready
								</p>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
});
