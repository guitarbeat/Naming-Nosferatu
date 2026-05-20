import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { getFlameCount, getHeatTextClasses, type HeatLevel } from "../utils/heat";
import { BracketTree } from "./BracketTree";

interface StreakBurst {
	key: number;
	side: "left" | "right";
	winnerName: string;
	streak: number;
	heatLevel: HeatLevel;
}

interface TournamentAnnouncementsProps {
	prefersReducedMotion: boolean | null;
	openingBracketReveal: boolean;
	openingEntrants: any[];
	tournamentMode: string;
	totalRounds: number;
	voteAnnouncement: string | null;
	currentMatchKey: string;
	streakBurst: StreakBurst | null;
	roundAnnouncement: number | null;
}

export function TournamentAnnouncements({
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
						transition={{ duration: prefersReducedMotion ? 0.08 : 0.42 }}
						className="absolute inset-0 z-40 flex items-center justify-center px-3 sm:px-6"
					>
						<div className="absolute inset-0 bg-slate-950/82 backdrop-blur-md" />
						<motion.div
							initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
							animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
							exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
							transition={{ duration: prefersReducedMotion ? 0.08 : 0.38 }}
							className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 overflow-hidden rounded-[2rem] border border-primary/20 bg-[radial-gradient(circle_at_top,rgba(57,189,216,0.18),rgba(2,6,23,0.96)_46%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8"
						>
							<div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.05),transparent)]" />
							<div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/70">
										Bracket Reveal
									</p>
									<h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
										The field is set
									</h3>
									<p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
										{tournamentMode === "2v2"
											? "Teams enter the night bracket. Watch the path lock in before Match 1 ignites."
											: "Every contender is seeded. The opening duel begins as soon as the bracket settles."}
									</p>
								</div>
								<div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
									<Trophy className="size-3.5 text-primary" />
									<span>{openingEntrants.length} contenders</span>
									<span className="h-1 w-1 rounded-full bg-white/25" />
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
												duration: prefersReducedMotion ? 0.08 : 0.3,
												delay: prefersReducedMotion ? 0 : 0.12 + index * 0.06,
											}}
											className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4"
										>
											<div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-accent to-chart-4" />
											<p className="pl-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
												Seed {index + 1}
											</p>
											<p className="pl-2 pt-2 font-display text-xl leading-tight text-white sm:text-2xl">
												{entrant.label}
											</p>
										</motion.div>
									))}
								</div>
								{openingEntrants.length > 8 && (
									<p className="mt-4 text-center text-xs uppercase tracking-[0.18em] text-white/48">
										+ {openingEntrants.length - 8} more contenders in the shadows
									</p>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{voteAnnouncement && (
					<motion.div
						key={`${voteAnnouncement}-${currentMatchKey}`}
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
						exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
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

			<AnimatePresence>
				{streakBurst && (
					<motion.div
						key={`streak-burst-${streakBurst.key}`}
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
						exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 1.03 }}
						transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
						className={`pointer-events-none absolute top-[20%] z-30 ${
							streakBurst.side === "left" ? "left-3 sm:left-6" : "right-3 text-right sm:right-6"
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
								{Array.from({ length: getFlameCount(streakBurst.streak, 9) }).map((_, i) => (
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
		</>
	);
}
