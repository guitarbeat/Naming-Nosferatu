export function MatchInfoPanel({
	matchupTone,
	pressureCopy,
	matchesRemaining,
	roundMatchesLeft,
}: {
	matchupTone: string;
	pressureCopy: string;
	matchesRemaining: number;
	roundMatchesLeft: number;
}) {
	return (
		<div className="grid md:grid-cols-[1.25fr_1fr_1fr] rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden">
			<div className="p-3 text-white/78 md:border-r border-white/10 border-b md:border-b-0">
				<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
					Match pulse
				</p>
				<p className="mt-2 text-sm font-semibold text-white">{matchupTone}</p>
				<p className="mt-1 text-xs leading-relaxed text-white/58">
					{pressureCopy}
				</p>
			</div>
			<div className="p-3 text-white/78 md:border-r border-white/10 border-b md:border-b-0">
				<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
					Road to crown
				</p>
				<p className="mt-2 text-sm font-semibold text-white">
					<span className="tabular-nums">{matchesRemaining}</span> match
					{matchesRemaining === 1 ? "" : "es"} after this
				</p>
				<p className="mt-1 text-xs leading-relaxed text-white/58">
					Roughly <span className="tabular-nums">{roundMatchesLeft}</span> duel
					{roundMatchesLeft === 1 ? "" : "s"} remain in the live bracket cycle.
				</p>
			</div>
			<div className="p-3 text-white/78">
				<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
					Quick controls
				</p>
				<div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
					<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/72">
						A / ← Left
					</span>
					<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/72">
						D / → Right
					</span>
					<span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/72">
						U Undo
					</span>
				</div>
			</div>
		</div>
	);
}
