import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useMemo } from "react";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel, SectionHeader } from "./components/DashboardPrimitives";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { useDashboardData } from "./hooks/useDashboardData";
import { PersonalResults } from "./PersonalResults";
import { DashboardHeader, getQuickStats } from "./DashboardHeader";
import { EngagementPanel } from "./EngagementPanel";
import { CommunityChartsPanel } from "./CommunityChartsPanel";

interface DashboardProps {
	personalRatings?: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew?: () => void;
	onUpdateRatings?: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName?: string;
	isAdmin?: boolean;
	isLoggedIn?: boolean;
	avatarUrl?: string;
	canHideNames?: boolean;
	onNameHidden?: (nameId: string) => void;
}

interface QuickStat {
	accent?: boolean;
	icon: ElementType;
	label: string;
	value: string | number;
}

export function Dashboard({
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
	const hasCommunityData = leaderboard.length > 0 || Boolean(siteStats);
	const _shouldShowDashboardPrimer =
		!hasPersonalRatings && !isLoadingLeaderboard && !hasCommunityData;

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
}
