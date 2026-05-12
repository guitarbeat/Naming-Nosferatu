import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { Loading } from "@/shared/components/layout/Feedback";
import { Trophy } from "@/shared/lib/icons";
import { ContextBadge, Panel, SectionHeader } from "./DashboardPrimitives";

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
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
					{leaderboard.map((entry, index) => (
						<div
							key={entry.name}
							className={`flex items-center gap-3 px-4 py-3 ${
								index < leaderboard.length - 1 ? "border-b border-white/10" : ""
							}`}
						>
							<div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-foreground">
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
						</div>
					))}
				</div>
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
