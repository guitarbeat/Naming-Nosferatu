import { Activity, BarChart3, Target, TrendingUp, Users } from "lucide-react";
import { memo } from "react";
import type { LeaderboardItem, SiteStats } from "@/shared/services/supabase/statsService";
import { Panel, SectionHeader, StatTile } from "../components/DashboardPrimitives";
import { RatingDistributionChart } from "../components/RatingDistributionChart";
import { RatingRadarChart } from "../components/RatingRadarChart";
import { TopNamesChart } from "../components/TopNamesChart";
import { WinLossChart } from "../components/WinLossChart";

export const DashboardCommunityStats = memo(function DashboardCommunityStats({
	leaderboard,
	siteStats,
}: {
	leaderboard: LeaderboardItem[];
	siteStats: SiteStats | null;
}) {
	return (
		<div className="grid gap-6">
			{leaderboard.length > 0 && (
				<>
					<div className="grid gap-6 xl:grid-cols-2">
						<Panel>
							<SectionHeader icon={BarChart3} title="Top Names by Rating" subtitle="Top scores." />
							<TopNamesChart leaderboard={leaderboard} />
						</Panel>

						<Panel>
							<SectionHeader
								icon={TrendingUp}
								title="Win and Loss Breakdown"
								subtitle="Wins vs losses."
							/>
							<WinLossChart leaderboard={leaderboard} />
						</Panel>
					</div>

					<div className="grid gap-6 xl:grid-cols-2">
						<Panel>
							<SectionHeader icon={Activity} title="Rating Distribution" subtitle="Score spread." />
							<RatingDistributionChart leaderboard={leaderboard} />
						</Panel>

						{leaderboard.length >= 3 && (
							<Panel>
								<SectionHeader icon={Target} title="Comparison Radar" subtitle="Side by side." />
								<RatingRadarChart leaderboard={leaderboard} />
							</Panel>
						)}
					</div>
				</>
			)}

			{siteStats && (
				<Panel>
					<SectionHeader icon={Users} title="Site Statistics" subtitle="Pool totals." />
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
						<StatTile label="Total names" value={siteStats.totalNames} icon={Activity} />
						<StatTile label="Active names" value={siteStats.activeNames} icon={Target} />
						<StatTile label="Users" value={siteStats.totalUsers} icon={Users} />
						<StatTile label="Ratings" value={siteStats.totalRatings} icon={BarChart3} />
						<StatTile
							label="Average rating"
							value={Math.round(siteStats.avgRating)}
							icon={TrendingUp}
							accent={true}
						/>
					</div>
				</Panel>
			)}
		</div>
	);
});
