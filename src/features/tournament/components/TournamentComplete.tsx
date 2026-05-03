import { LogOut, Trophy } from "@/shared/lib/icons";

interface TournamentCompleteProps {
	totalMatches: number;
	participantCount: number;
	onNewTournament: () => void;
}

export function TournamentComplete({
	totalMatches,
	participantCount,
	onNewTournament,
}: TournamentCompleteProps) {
	return (
		<div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 font-display text-foreground selection:bg-primary/30">
			{/* Subtle static gradient background */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background: `
						radial-gradient(ellipse 60% 45% at 25% 20%, hsl(142 50% 14% / 0.22) 0%, transparent 60%),
						radial-gradient(ellipse 50% 40% at 75% 75%, hsl(190 55% 16% / 0.18) 0%, transparent 55%)
					`,
				}}
			/>

			<div className="relative z-10 w-full max-w-lg text-center">
				{/* Icon */}
				<div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
					<Trophy className="size-8 text-primary/80" />
				</div>

				<h1 className="font-display text-3xl font-black uppercase leading-[0.92] tracking-[-0.03em] text-white sm:text-4xl">
					Tournament Complete
				</h1>
				<p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/45">
					Your results are ready to review in the analysis section below.
				</p>

				{/* Stats */}
				<div className="mt-8 grid grid-cols-2 gap-3">
					<div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left">
						<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
							Total Matches
						</p>
						<p className="mt-1.5 text-2xl font-semibold text-white/80">{totalMatches}</p>
					</div>
					<div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left">
						<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
							Participants
						</p>
						<p className="mt-1.5 text-2xl font-semibold text-white/80">{participantCount}</p>
					</div>
				</div>

				{/* Actions */}
				<div className="mt-6 flex flex-col gap-3">
					<button
						type="button"
						onClick={() =>
							document
								.getElementById("analysis")
								?.scrollIntoView({ behavior: "smooth", block: "start" })
						}
						className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-primary/20 bg-primary/10 px-6 py-3.5 text-sm font-semibold text-primary/90 transition-colors hover:bg-primary/15"
					>
						<Trophy size={14} />
						View Analysis
					</button>

					<button
						type="button"
						onClick={onNewTournament}
						className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-6 py-3.5 text-sm font-semibold text-white/55 transition-colors hover:border-white/12 hover:bg-white/[0.04] hover:text-white/70"
					>
						<LogOut size={14} />
						Start New Tournament
					</button>
				</div>
			</div>
		</div>
	);
}
