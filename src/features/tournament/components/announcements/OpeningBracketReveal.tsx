import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { BracketTree } from "../BracketTree";

interface OpeningBracketRevealProps {
	prefersReducedMotion: boolean | null;
	openingBracketReveal: boolean;
	openingEntrants: Array<{ id: string; label: string }>;
	tournamentMode: string;
	totalRounds: number;
}

export function OpeningBracketReveal({
	prefersReducedMotion,
	openingBracketReveal,
	openingEntrants,
	tournamentMode,
	totalRounds,
}: OpeningBracketRevealProps) {
	return (
		<AnimatePresence>
			{openingBracketReveal && openingEntrants.length > 1 && (
				<motion.div
					initial={
						prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }
					}
					animate={
						prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
					}
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
						initial={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }
						}
						animate={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
						}
						exit={
							prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16 }
						}
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
										initial={
											prefersReducedMotion
												? { opacity: 1 }
												: { opacity: 0, y: 18 }
										}
										animate={
											prefersReducedMotion
												? { opacity: 1 }
												: { opacity: 1, y: 0 }
										}
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
	);
}
