import { LogOut, Trophy } from "lucide-react";
import { NameOrb } from "@/components/GlassEffects";
import { Button, Card } from "@/components/UiPrimitives";
import type { MatchRecord, NameItem, Team, TournamentMode } from "@/types";
import { TournamentBracket } from "./TournamentBracket";

/* ==========================================================================
   2. TOURNAMENT COMPLETE VIEW
   ========================================================================== */

export interface TournamentCompleteProps {
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

	const winningTeam = winnerId ? teams.find((t) => t?.id === winnerId) : undefined;
	const winningNameItem = winnerId
		? names.find((n) => n && (String(n.id) === String(winnerId) || n.name === String(winnerId)))
		: undefined;

	const winnerDisplayName = winningTeam
		? winningTeam.memberNames.join(" & ")
		: winningNameItem?.name || (winnerId ? String(winnerId) : null);

	return (
		<div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden py-12 text-foreground">
			<div className="relative z-10 flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
				<div className="mb-6 flex size-20 items-center justify-center rounded-[2rem] border border-primary/20 bg-card shadow-[0_0_40px_var(--primary)] backdrop-blur-xl">
					<Trophy className="size-9 text-primary" />
				</div>

				<p className="text-xs font-semibold tracking-wide text-muted-foreground">
					Tournament finished
				</p>

				<h1 className="mt-2 max-w-4xl text-balance font-display text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[0.95] tracking-tight text-foreground">
					Tournament Complete
				</h1>

				{winnerDisplayName && (
					<div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-primary/30 bg-primary/10 px-8 py-6 shadow-md backdrop-blur-md">
						<span className="text-xs font-bold tracking-wider text-primary">Crowned Champion</span>
						{winningTeam && winningTeam.memberNames.length > 1 ? (
							<div className="relative flex items-center justify-center -space-x-2 py-1">
								{winningTeam.memberNames.map((memberName, idx) => {
									const memberItem = names.find(
										(n) => n && n.name.toLowerCase() === memberName.toLowerCase(),
									);
									return (
										<div
											key={`${memberName}-${idx}`}
											className={idx === 0 ? "-rotate-3" : "rotate-3"}
										>
											<NameOrb
												orbId={`champ-${memberName}-${idx}`}
												name={memberName}
												orbitText={memberItem?.description || ""}
												size={132}
											/>
										</div>
									);
								})}
								<div className="absolute z-20 flex size-8 items-center justify-center rounded-full border border-primary/40 bg-card text-primary shadow-md font-display font-black text-sm">
									+
								</div>
							</div>
						) : (
							<NameOrb
								orbId={`champ-${winnerId ?? winnerDisplayName}`}
								name={winnerDisplayName}
								orbitText={winningNameItem?.description || ""}
								size={152}
							/>
						)}
						<span className="font-display text-2xl sm:text-3xl font-black text-foreground">
							{winnerDisplayName}
						</span>
						{winningNameItem?.description && (
							<p className="text-xs text-muted-foreground italic max-w-md">
								{winningNameItem.description}
							</p>
						)}
					</div>
				)}

				<p className="mt-4 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
					Review the final bracket path and Elo rankings below, or start a fresh tournament round.
				</p>

				<div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
					<Card className="px-6 py-4 bg-card/80">
						<p className="text-xs font-semibold text-muted-foreground">Total matches</p>
						<p className="mt-2 font-mono tabular-nums text-3xl font-black leading-none text-foreground">
							{totalMatches}
						</p>
					</Card>
					<Card className="px-6 py-4 bg-card/80">
						<p className="text-xs font-semibold text-muted-foreground">Participants</p>
						<p className="mt-2 font-mono tabular-nums text-3xl font-black leading-none text-foreground">
							{participantCount}
						</p>
					</Card>
				</div>

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
							className="shadow-xl border-primary/20 bg-card/70 backdrop-blur-xl p-2 rounded-3xl"
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
						<LogOut size={16} />
						Start New Tournament
					</Button>
				</div>
			</div>
		</div>
	);
}
