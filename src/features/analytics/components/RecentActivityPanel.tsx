import Button from "@/shared/components/layout/Button";
import { Activity, TrendingUp, Trophy, Users } from "lucide-react";
import type { DashboardTimeframe } from "../hooks/useDashboardData";
import { Panel, SectionHeader, StatTile } from "./DashboardPrimitives";

interface EngagementMetrics {
	peakActiveUsers: number;
	totalMatches: number;
}

interface RecentActivityPanelProps {
	engagementMetrics: EngagementMetrics | null;
	timeframe: DashboardTimeframe;
	setTimeframe: (timeframe: DashboardTimeframe) => void;
	refreshEngagementMetrics: () => void;
	isLoadingEngagement: boolean;
}

export function RecentActivityPanel({
	engagementMetrics,
	timeframe,
	setTimeframe,
	refreshEngagementMetrics,
	isLoadingEngagement,
}: RecentActivityPanelProps) {
	if (!engagementMetrics) {
		return null;
	}

	return (
		<Panel>
			<SectionHeader
				icon={TrendingUp}
				title="Recent Activity"
				subtitle="Last window."
				action={
					<div className="flex items-center gap-2">
						<select
							value={timeframe}
							onChange={(event) => setTimeframe(event.target.value as DashboardTimeframe)}
							className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-foreground"
						>
							<option value="day">24 hours</option>
							<option value="week">Week</option>
							<option value="month">Month</option>
						</select>
						<Button
							variant="outline"
							size="small"
							onClick={() => refreshEngagementMetrics()}
							disabled={isLoadingEngagement}
						>
							<Activity size={14} />
							Refresh
						</Button>
					</div>
				}
			/>
			<div className="grid gap-3 sm:grid-cols-2">
				<StatTile
					label="Active raters"
					value={engagementMetrics.peakActiveUsers}
					icon={Users}
					accent={true}
				/>
				<StatTile label="Matches played" value={engagementMetrics.totalMatches} icon={Trophy} />
			</div>
		</Panel>
	);
}
