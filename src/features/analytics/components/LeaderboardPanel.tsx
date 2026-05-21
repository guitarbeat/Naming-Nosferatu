import { Trophy } from "lucide-react";
import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { ContextBadge, ListPanel, ListPanelRow, Panel, SectionHeader } from "./DashboardPrimitives";
import { themeSurfaces } from "@/shared/lib/themeClasses";

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
					{leaderboard.map((entry, index) => (
						<ListPanelRow
							key={entry.name}
							divided={index < leaderboard.length - 1}
						>
							<div
								className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold text-foreground ${themeSurfaces.avatar}`}
							>
								{index + 1}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
								<p className="text-xs text-muted-foreground/70">
									{entry.total_ratings} rating
									{entry.total_ratings === 1 ? "" : "s"} | {entry.wins} win
									{entry.wins === 1 ? "" : "s"}
								</p>
							</div>
							<div className="text-right">
								<p className="text-lg font-semibold text-primary">{Math.round(entry.avg_rating)}</p>
							</div>
						</ListPanelRow>
					))}
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
