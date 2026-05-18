import { Activity, BarChart3, Target, TrendingUp, Users } from "@/shared/lib/icons";
import type { SiteStats } from "@/shared/services/supabase/statsService";
import { Panel, SectionHeader, StatTile } from "./DashboardPrimitives";

interface SiteStatsPanelProps {
	siteStats: SiteStats | null;
}

export function SiteStatsPanel({ siteStats }: SiteStatsPanelProps) {
	if (!siteStats) {
		return null;
	}

	return (
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
	);
}
