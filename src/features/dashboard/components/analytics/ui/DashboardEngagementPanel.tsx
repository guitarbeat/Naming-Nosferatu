import { motion, useReducedMotion } from "framer-motion";
import { Activity, TrendingUp, Trophy, Users } from "lucide-react";
import { memo } from "react";
import Button from "@/shared/components/layout/Button";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import type { EngagementMetrics } from "@/shared/services/supabase/statsService";
import { Panel, SectionHeader, StatTile } from "../components/DashboardPrimitives";
import type { DashboardTimeframe } from "../hooks/useDashboardData";

const TIMEFRAME_OPTIONS = [
	{ value: "day" as const, label: "24h" },
	{ value: "week" as const, label: "Week" },
	{ value: "month" as const, label: "Month" },
] as const;

export const DashboardEngagementPanel = memo(function DashboardEngagementPanel({
	engagementMetrics,
	timeframe,
	setTimeframe,
	refreshEngagementMetrics,
	isLoadingEngagement,
}: {
	engagementMetrics: EngagementMetrics | null;
	timeframe: DashboardTimeframe;
	setTimeframe: (tf: DashboardTimeframe) => void;
	refreshEngagementMetrics: () => void;
	isLoadingEngagement: boolean;
}) {
	const prefersReducedMotion = useReducedMotion();

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
					<motion.div
						className="flex items-center gap-3"
						initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
						animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					>
						<MagicToggle
							options={TIMEFRAME_OPTIONS}
							value={timeframe}
							onChange={setTimeframe}
							ariaLabel="Select timeframe"
						/>
						<Button
							variant="outline"
							size="small"
							onClick={() => refreshEngagementMetrics()}
							disabled={isLoadingEngagement}
						>
							<Activity size={14} />
							Refresh
						</Button>
					</motion.div>
				}
			/>
			<motion.div
				className="grid gap-3 sm:grid-cols-2"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{
					duration: prefersReducedMotion ? 0 : 0.4,
					delay: prefersReducedMotion ? 0 : 0.1,
				}}
			>
				<StatTile
					label="Active raters"
					value={engagementMetrics.peakActiveUsers}
					icon={Users}
					accent={true}
				/>
				<StatTile label="Matches played" value={engagementMetrics.totalMatches} icon={Trophy} />
			</motion.div>
		</Panel>
	);
});
