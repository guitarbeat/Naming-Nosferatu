import { Activity, Target, Users } from "lucide-react";
import { memo } from "react";
import type { LeaderboardItem, SiteStats } from "@/shared/api";
import { Panel, SectionHeader } from "./Common";
import { RatingDistributionChart, RatingRadarChart, TopNamesChart, WinLossChart } from "./charts";

export const CommunityChartsPanel = memo(function CommunityChartsPanel({
	leaderboard,
	siteStats,
}: {
	leaderboard: LeaderboardItem[];
	siteStats: SiteStats | null;
}) {
	const totalRatings =
		siteStats && "totalRatings" in siteStats
			? (siteStats as unknown as { totalRatings: number }).totalRatings
			: (siteStats?.totalMatches ?? 0);

	return (
		<Panel className="flex flex-col h-full">
			<SectionHeader
				icon={Activity}
				title="Community Insights"
				subtitle="Aggregate data across all users and matches."
				action={
					siteStats ? (
						<div className="flex items-center gap-4 text-xs font-medium">
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<Users className="size-3.5 text-primary/70" />
								{siteStats.totalUsers} contributors
							</span>
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<Target className="size-3.5 text-accent/70" />
								{totalRatings} ratings
							</span>
						</div>
					) : undefined
				}
			/>

			<div className="grid gap-4 flex-1">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Top Contenders
						</h4>
						<TopNamesChart leaderboard={leaderboard} limit={8} />
					</div>

					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Win/Loss Head-to-Head
						</h4>
						<WinLossChart leaderboard={leaderboard} limit={8} />
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-[1fr_minmax(0,18rem)]">
					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Rating Distribution Curve
						</h4>
						<RatingDistributionChart leaderboard={leaderboard} />
					</div>
					<div className="space-y-2">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
							Metrics Radar
						</h4>
						<RatingRadarChart leaderboard={leaderboard} limit={5} />
					</div>
				</div>
			</div>
		</Panel>
	);
});
