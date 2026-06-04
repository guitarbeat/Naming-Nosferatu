import { Trophy } from "lucide-react";
import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { themeSurfaces } from "@/shared/lib/themeClasses";
import { cn } from "@/shared/lib/utils";
import { ContextBadge, ListPanel, ListPanelRow, Panel, SectionHeader } from "./DashboardPrimitives";

interface LeaderboardEntry {
	name: string;
	total_ratings: number;
	wins: number;
	avg_rating: number;
}

interface LeaderboardPanelProps {
	leaderboard: LeaderboardEntry[];
	isLoadingLeaderboard: boolean;
	onStartNew?: () => void;
}

export function LeaderboardPanel({
	leaderboard,
	isLoadingLeaderboard,
	onStartNew,
}: LeaderboardPanelProps) {
	return (
		<Panel>
			<SectionHeader
				icon={Trophy}
				title="Leaderboard"
				subtitle="Top of the pool."
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
						const medals = ["🥇", "🥈", "🥉"];
						const medal = index < 3 ? medals[index] : null;
						return (
							<ListPanelRow
								key={entry.name}
								divided={index < leaderboard.length - 1}
								className="hover:bg-muted/40 transition-colors"
							>
								<div className={cn(
									"flex items-center justify-center text-sm font-bold min-w-[2.5rem] rounded-lg",
									index < 3
										? "bg-gradient-to-br from-yellow-600/20 to-amber-600/20 text-lg"
										: `flex size-9 items-center justify-center rounded-full ${themeSurfaces.avatar}`
								)}>
									{medal || index + 1}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
									<div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground/70">
										<span>📊 {entry.total_ratings} rating{entry.total_ratings === 1 ? "" : "s"}</span>
										<span>🏆 {entry.wins} win{entry.wins === 1 ? "" : "s"}</span>
									</div>
								</div>
								<div className="text-right flex flex-col items-end gap-1">
									<div className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1 font-bold text-primary">
										{Math.round(entry.avg_rating)}
									</div>
									<p className="text-xs text-muted-foreground/60 font-medium">Rating</p>
								</div>
							</ListPanelRow>
						);
					})}
				</ListPanel>
			) : (
				<EmptyState
					variant="box"
					title="No community ratings yet."
					description="Complete a few tournament sessions to start separating the personal bracket layer from the shared leaderboard."
				/>
			)}
		</Panel>
	);
}
