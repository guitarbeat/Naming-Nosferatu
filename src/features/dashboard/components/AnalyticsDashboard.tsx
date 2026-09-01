import { Trophy } from "lucide-react";
import { memo, useMemo } from "react";
import { useDashboardData } from "../hooks";
import type { DashboardProps } from "../types";
import { ContextBadge, Panel, SectionHeader } from "./Common";
import {
	CommunityChartsPanel,
	DashboardHeader,
	EngagementPanel,
	getQuickStats,
	LeaderboardPanel,
} from "./DashboardPanels";
import { PersonalResults } from "./PersonalResults";

// ⚡ Bolt Performance Optimization: Wrapped AnalyticsDashboard in React.memo()
// Prevents unnecessary re-renders of the entire dashboard when higher-level context changes
export const AnalyticsDashboard = memo(function AnalyticsDashboard({
	userName = "",
	isAdmin = false,
	isLoggedIn = false,
	avatarUrl,
	onStartNew,
	onUpdateRatings,
	personalRatings,
	currentTournamentNames,
}: DashboardProps) {
	const handleStartNew = onStartNew ?? (() => undefined);
	const {
		engagementMetrics,
		isLoadingEngagement,
		isLoadingLeaderboard,
		leaderboard,
		refreshEngagementMetrics,
		setTimeframe,
		siteStats,
		timeframe,
		userStats,
	} = useDashboardData({ userName });
	const quickStats = useMemo(
		() => getQuickStats({ siteStats, userName, userStats }),
		[siteStats, userName, userStats],
	);
	const hasPersonalRatings = Boolean(personalRatings && Object.keys(personalRatings).length > 0);

	return (
		<div className="w-full space-y-8 sm:space-y-10">
			<DashboardHeader
				isLoggedIn={isLoggedIn}
				userName={userName}
				avatarUrl={avatarUrl}
				isAdmin={isAdmin}
				quickStats={quickStats}
				userStats={userStats}
			/>

			{hasPersonalRatings && onUpdateRatings && (
				<Panel>
					<SectionHeader
						icon={Trophy}
						title="Your Rankings"
						subtitle="Your saved order."
						action={<ContextBadge label="Personal" tone="accent" />}
					/>
					<PersonalResults
						personalRatings={personalRatings}
						currentTournamentNames={currentTournamentNames}
						onStartNew={handleStartNew}
						onUpdateRatings={onUpdateRatings}
						userName={userName}
					/>
				</Panel>
			)}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
				<LeaderboardPanel
					leaderboard={leaderboard}
					isLoadingLeaderboard={isLoadingLeaderboard}
					onStartNew={onStartNew}
				/>

				<CommunityChartsPanel leaderboard={leaderboard} siteStats={siteStats} />
			</div>

			<EngagementPanel
				engagementMetrics={engagementMetrics}
				timeframe={timeframe}
				setTimeframe={setTimeframe}
				refreshEngagementMetrics={refreshEngagementMetrics}
				isLoadingEngagement={isLoadingEngagement}
			/>
		</div>
	);
});
