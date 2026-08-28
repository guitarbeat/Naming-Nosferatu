import { Flame, Star, Trophy } from "lucide-react";
import { memo } from "react";
import { Button, EmptyState, Loading } from "@/shared/components";
import type { LeaderboardEntry } from "../types";
import { ContextBadge, ListPanel, ListPanelRow, Panel, RankChip, SectionHeader } from "./Common";

export const LeaderboardPanel = memo(function LeaderboardPanel({
	leaderboard,
	isLoadingLeaderboard,
	onStartNew,
}: {
	leaderboard: LeaderboardEntry[];
	isLoadingLeaderboard: boolean;
	onStartNew?: () => void;
}) {
	return (
		<Panel>
			<SectionHeader
				icon={Trophy}
				title="Leaderboard"
				subtitle="Top contenders across all tournament matchups."
				action={
					<div className="flex items-center gap-2">
						<ContextBadge label="Community" />
						{onStartNew && (
							<Button variant="outline" size="small" onClick={onStartNew}>
								New Tournament
							</Button>
						)}
					</div>
				}
			/>

			{isLoadingLeaderboard ? (
				<Loading variant="skeleton" height={320} />
			) : leaderboard.length > 0 ? (
				<ListPanel>
					{leaderboard.map((entry, index) => {
						const rank = index + 1;
						return (
							<ListPanelRow
								key={entry.name}
								divided={index < leaderboard.length - 1}
								className="group transition-colors hover:bg-muted/30"
							>
								<RankChip rank={rank} />

								<div className="min-w-0 flex-1">
									<p className="truncate font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
										{entry.name}
									</p>
									<div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
										<span className="inline-flex items-center gap-1">
											<Star className="size-3 text-muted-foreground/60" />
											<span className="font-mono tabular-nums">{entry.total_ratings}</span> rating
											{entry.total_ratings === 1 ? "" : "s"}
										</span>
										<span className="inline-flex items-center gap-1">
											<Flame className="size-3 text-accent" />
											<span className="font-mono tabular-nums">{entry.wins}</span> win
											{entry.wins === 1 ? "" : "s"}
										</span>
									</div>
								</div>

								<div className="text-right flex flex-col items-end">
									<div className="inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-bold text-primary tabular-nums shadow-2xs">
										{Math.round(entry.avg_rating)}
									</div>
									<span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
										Rating
									</span>
								</div>
							</ListPanelRow>
						);
					})}
				</ListPanel>
			) : (
				<EmptyState
					title="No community ratings yet"
					description="Complete tournament battles to rank contenders and establish the community leaderboard."
				/>
			)}
		</Panel>
	);
});
