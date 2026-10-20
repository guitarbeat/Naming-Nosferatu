import { LogOut, Trophy } from "lucide-react";
import { Button, Card } from "@/components/LayoutBlocks";
import { TournamentBracket } from "@/tournament/TournamentBracket";
import type { MatchRecord, NameItem, Team, TournamentMode } from "@/types";

interface TournamentCompleteProps {
	totalMatches: number;
	participantCount: number;
	onNewTournament: () => void;
	bracketEntrants?: string[];
	matchHistory?: MatchRecord[];
	names?: NameItem[];
	teams?: Team[];
	ratings?: Record<string, number>;
	totalRounds?: number;
	tournamentMode?: TournamentMode;
}

export function TournamentComplete({
	totalMatches,
	participantCount,
	onNewTournament,
	bracketEntrants = [],
	matchHistory = [],
	names = [],
	teams = [],
	ratings = {},
	totalRounds,
	tournamentMode = "1v1",
}: TournamentCompleteProps) {
	const winningRecord = matchHistory.length > 0 ? matchHistory[matchHistory.length - 1] : null;
	const winnerId = winningRecord?.winner;

	// ⚡ Bolt Performance Optimization: Replace expensive Map creation with direct array find for single conditional lookups
	const winningTeam = winnerId ? teams.find((t) => t?.id === winnerId) : undefined;
	const winningNameItem = winnerId
		? names.find((n) => n && (String(n.id) === String(winnerId) || n.name === String(winnerId)))
		: undefined;

	const winnerDisplayName = winningTeam
		? winningTeam.memberNames.join(" & ")
		: winningNameItem?.name || (winnerId ? String(winnerId) : null);

	return (
		<div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden py-12 text-foreground">
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background: `
						radial-gradient(ellipse 70% 55% at 15% 15%, var(--primary) 0%, transparent 65%),
						radial-gradient(ellipse 60% 50% at 85% 20%, var(--primary) 0%, transparent 60%),
						radial-gradient(ellipse 65% 55% at 50% 90%, var(--primary) 0%, transparent 65%),
						radial-gradient(ellipse 50% 45% at 80% 70%, var(--primary) 0%, transparent 55%),
						radial-gradient(ellipse 55% 50% at 20% 75%, var(--primary) 0%, transparent 60%)
					`,
				}}
			/>
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(ellipse 80% 70% at 50% 50%, transparent 10%, var(--primary) 100%)",
				}}
			/>

			<div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
				<div className="mb-6 flex size-20 items-center justify-center rounded-[2rem] border border-primary/20 bg-card shadow-[0_0_40px_var(--primary)] backdrop-blur-xl">
					<Trophy className="size-9 text-primary" />
				</div>

				<p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
					Tournament finished
				</p>

				<h1 className="mt-2 max-w-4xl text-pretty font-display text-[clamp(2.5rem,8vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-foreground drop-shadow-[0_2px_20px_var(--primary)]">
					Tournament Complete
				</h1>

				{winnerDisplayName && (
					<div className="mt-4 flex flex-col items-center rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3 shadow-md backdrop-blur-md">
						<span className="text-[11px] font-bold uppercase tracking-wider text-primary">
							Winner
						</span>
						<span className="mt-0.5 font-display text-2xl sm:text-3xl font-black text-foreground">
							{winnerDisplayName}
						</span>
						{winningNameItem?.description && (
							<p className="mt-1 text-xs text-muted-foreground italic max-w-md">
								{winningNameItem.description}
							</p>
						)}
					</div>
				)}

				<p className="mt-3 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
					The tournament is complete. Review the final bracket and rankings below.
				</p>

				<div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
					<Card className="px-6 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)] bg-card/80">
						<p className="text-[10px] font-semibold tracking-wide text-muted-foreground">
							Total matches
						</p>
						<p className="mt-2 text-3xl font-black leading-none text-foreground">{totalMatches}</p>
					</Card>
					<Card className="px-6 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)] bg-card/80">
						<p className="text-[10px] font-semibold tracking-wide text-muted-foreground">
							Participants
						</p>
						<p className="mt-2 text-3xl font-black leading-none text-foreground">
							{participantCount}
						</p>
					</Card>
				</div>

				{/* Full Visual Bracket Component in Post-Game State */}
				{bracketEntrants.length > 0 && (
					<div className="mt-10 w-full text-left">
						<TournamentBracket
							inline={true}
							isComplete={true}
							bracketEntrants={bracketEntrants}
							matchHistory={matchHistory}
							names={names}
							teams={teams}
							ratings={ratings}
							totalRounds={totalRounds}
							tournamentMode={tournamentMode}
							className="shadow-2xl border-primary/20 bg-card/70 backdrop-blur-xl"
						/>
					</div>
				)}

				<div className="mt-8 flex w-full max-w-sm justify-center">
					<Button
						variant="primary"
						size="large"
						onClick={onNewTournament}
						className="w-full flex justify-center gap-2.5 rounded-full shadow-lg"
					>
						<LogOut size={15} />
						Start New Tournament
					</Button>
				</div>
			</div>
		</div>
	);
}
