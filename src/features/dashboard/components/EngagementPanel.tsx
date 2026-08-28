import { motion, useReducedMotion } from "framer-motion";
import { Activity, TrendingUp, Trophy, Users } from "lucide-react";
import { memo } from "react";
import type { EngagementMetrics } from "@/shared/api";
import { Button } from "@/shared/components";
import { MOTION_DURATIONS, MOTION_EASING } from "@/shared/lib/uiUtils";
import type { DashboardTimeframe } from "../hooks/useDashboardData";
import { Panel, SectionHeader, StatTile } from "./Common";

const TIMEFRAME_OPTIONS = [
	{ value: "day" as const, label: "24h" },
	{ value: "week" as const, label: "Week" },
	{ value: "month" as const, label: "Month" },
] as const;

export const EngagementPanel = memo(function EngagementPanel({
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

	// Safely access properties on engagement metrics
	const peakActiveUsers =
		"peakActiveUsers" in engagementMetrics
			? (engagementMetrics as unknown as { peakActiveUsers: number }).peakActiveUsers
			: engagementMetrics.current;
	const totalMatches =
		"totalMatches" in engagementMetrics
			? (engagementMetrics as unknown as { totalMatches: number }).totalMatches
			: engagementMetrics.previous;

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
						transition={{
							duration: MOTION_DURATIONS.base,
							ease: MOTION_EASING.easeStandard,
						}}
					>
						<div className="flex bg-black/20 rounded-lg p-1">
							{TIMEFRAME_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setTimeframe(opt.value)}
									className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
										timeframe === opt.value
											? "bg-primary/20 text-primary shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
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
					duration: prefersReducedMotion
						? MOTION_DURATIONS.reducedMotionDuration
						: MOTION_DURATIONS.slow,
					delay: prefersReducedMotion ? 0 : 0.1,
				}}
			>
				<StatTile label="Active raters" value={peakActiveUsers} icon={Users} accent={true} />
				<StatTile label="Matches played" value={totalMatches} icon={Trophy} />
			</motion.div>
		</Panel>
	);
});
