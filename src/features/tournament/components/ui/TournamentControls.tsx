import { Undo2, Volume2, VolumeX, X } from "lucide-react";

interface TournamentControlsProps {
	// biome-ignore lint/suspicious/noExplicitAny: using any here because the manager has a large API surface and strict typing brings no specific value here.
	audioManager: any;
	canUndo: boolean;
	handleUndo: () => void;
	quitTournament: () => void;
}

export function TournamentControls({
	audioManager,
	canUndo,
	handleUndo,
	quitTournament,
}: TournamentControlsProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{(
				[
					{
						action: audioManager.handleToggleMute,
						icon: audioManager.isMuted ? VolumeX : Volume2,
						label: audioManager.isMuted ? "Unmute" : "Mute",
					},
				] as const
			).map(({ action, icon: Icon, label, active }) => (
				<button
					key={label}
					type="button"
					onClick={action}
					className={`inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm transition-[background-color,color,opacity] active:scale-[0.96] ${
						active
							? "border-primary/30 bg-primary/15 text-primary"
							: "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white"
					}`}
					aria-label={label}
					aria-pressed={active !== undefined ? active : undefined}
					title={label}
				>
					<Icon className="size-4" />
				</button>
			))}
			<button
				type="button"
				onClick={() => handleUndo()}
				className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${
					canUndo
						? "border-primary/30 bg-primary/12 text-primary hover:bg-primary/18"
						: "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/35"
				}`}
				aria-label="Undo last vote"
				title={canUndo ? "Undo last vote" : "No actions to undo"}
				disabled={!canUndo}
			>
				<Undo2 className="size-4" />
				<span className="hidden sm:inline">Undo</span>
			</button>
			<button
				type="button"
				onClick={quitTournament}
				className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/12 px-3 text-sm text-destructive transition-colors hover:bg-destructive/18"
				aria-label="Quit tournament"
			>
				<X className="size-4" />
				<span className="hidden sm:inline">Exit</span>
			</button>
		</div>
	);
}
