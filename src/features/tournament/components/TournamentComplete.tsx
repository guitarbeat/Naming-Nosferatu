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
		<div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 text-foreground selection:bg-primary/30">
			{/* Background ambience */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background: `
						radial-gradient(ellipse 70% 55% at 50% 30%, hsl(180 50% 12% / 0.28) 0%, transparent 65%),
						radial-gradient(ellipse 50% 40% at 20% 80%, hsl(142 40% 10% / 0.18) 0%, transparent 55%)
					`,
				}}
			/>

			<div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
				{/* Trophy icon */}
				<div
					className="mb-8 flex size-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/8"
					style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.15), 0 8px 32px rgba(0,0,0,0.2)" }}
				>
					<Trophy className="size-9 text-primary" />
				</div>

				{/* Title */}
				<h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
					Tournament<br />
					<span className="text-primary">Complete</span>
				</h1>

				<p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
					Your results are ready to review in the analysis section below.
				</p>

				{/* Stats row */}
				<div className="mt-10 flex items-center gap-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
					<div className="flex flex-col items-center px-8 py-5">
						<p className="text-3xl font-bold text-white/85">{totalMatches}</p>
						<p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
							Matches
						</p>
					</div>
					<div className="h-12 w-px bg-white/[0.07]" />
					<div className="flex flex-col items-center px-8 py-5">
						<p className="text-3xl font-bold text-white/85">{participantCount}</p>
						<p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
							Names
						</p>
					</div>
				</div>

				{/* Actions */}
				<div className="mt-8 flex w-full flex-col gap-2.5">
					<button
						type="button"
						onClick={() =>
							document
								.getElementById("analysis")
								?.scrollIntoView({ behavior: "smooth", block: "start" })
						}
						className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-primary/25 bg-primary/12 px-6 py-4 text-sm font-semibold text-primary transition-all hover:bg-primary/18 hover:border-primary/35 active:scale-[0.98]"
					>
						<Trophy size={15} />
						View Analysis
					</button>

					<button
						type="button"
						onClick={onNewTournament}
						className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-white/[0.07] bg-transparent px-6 py-4 text-sm font-medium text-white/45 transition-all hover:border-white/12 hover:bg-white/[0.03] hover:text-white/60 active:scale-[0.98]"
					>
						<LogOut size={15} />
						Start New Tournament
					</button>
				</div>
			</div>
		</div>
	);
}
