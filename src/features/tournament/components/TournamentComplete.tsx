import { LogOut, Trophy } from "lucide-react";

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
		/*
		 * Full-bleed wrapper: breaks out of any padded/max-width parent container
		 * by using negative margins + 100vw so the colorful background covers
		 * the full viewport width regardless of parent constraints.
		 */
		<div
			className="relative flex min-h-[80vh] w-screen flex-col items-center justify-center overflow-hidden py-16 text-foreground"
			style={{ marginInline: "calc((100% - 100vw) / 2)" }}
		>
			{/* Colorful background blobs */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background: `
						radial-gradient(ellipse 70% 55% at 15% 15%, hsl(280 80% 40% / 0.60) 0%, transparent 65%),
						radial-gradient(ellipse 60% 50% at 85% 20%, hsl(190 90% 35% / 0.55) 0%, transparent 60%),
						radial-gradient(ellipse 65% 55% at 50% 90%, hsl(340 75% 38% / 0.50) 0%, transparent 65%),
						radial-gradient(ellipse 50% 45% at 80% 70%, hsl(25 85% 40% / 0.45) 0%, transparent 55%),
						radial-gradient(ellipse 55% 50% at 20% 75%, hsl(150 70% 30% / 0.45) 0%, transparent 60%)
					`,
				}}
			/>
			{/* Dark vignette for contrast */}
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 10%, hsl(230 30% 6% / 0.50) 100%)`,
				}}
			/>

			<div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center sm:px-8">
				<div className="mb-8 flex size-20 items-center justify-center rounded-[1.75rem] border border-white/25 bg-white/10 shadow-[0_0_60px_rgba(180,120,255,0.55)] backdrop-blur-xl">
					<Trophy className="size-9 text-yellow-300" />
				</div>

				<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
					Tournament finished
				</p>

				<h1 className="mt-4 max-w-4xl text-pretty font-display text-[clamp(3rem,10vw,6.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-white drop-shadow-[0_2px_32px_rgba(180,120,255,0.55)]">
					Tournament Complete
				</h1>

				<p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-white/70 sm:text-base">
					Your results are ready to review in the analysis section below.
				</p>

				<div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
					<div className="rounded-[1.5rem] border border-white/20 bg-white/[0.08] px-6 py-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm">
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">Total matches</p>
						<p className="mt-3 text-4xl font-black leading-none text-white">{totalMatches}</p>
					</div>
					<div className="rounded-[1.5rem] border border-white/20 bg-white/[0.08] px-6 py-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm">
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">Participants</p>
						<p className="mt-3 text-4xl font-black leading-none text-white">{participantCount}</p>
					</div>
				</div>

				<div className="mt-10 flex w-full flex-col gap-3">
					<button
						type="button"
						onClick={() => document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth", block: "start" })}
						className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-white/15 px-6 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(180,120,255,0.35)] backdrop-blur-sm transition-all hover:bg-white/22 hover:shadow-[0_0_40px_rgba(180,120,255,0.55)] active:scale-[0.98]"
					>
						<Trophy size={15} />
						View Analysis
					</button>

					<button
						type="button"
						onClick={onNewTournament}
						className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.05] px-6 py-4 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-[0.98]"
					>
						<LogOut size={15} />
						Start New Tournament
					</button>
				</div>
			</div>
		</div>
	);
}
