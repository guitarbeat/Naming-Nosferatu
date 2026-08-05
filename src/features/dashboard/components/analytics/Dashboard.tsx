import { motion } from "framer-motion";
import { Activity, BarChart3, Target, TrendingUp, Trophy, User, Users } from "lucide-react";
import { type ElementType, memo } from "react";
import Button from "@/shared/components/layout/Button";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import { themeSurfaces, themeText } from "@/shared/lib/themeClasses";
import type { SiteStats, UserStats } from "@/shared/services/supabase/statsService";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel, SectionHeader, StatTile } from "./components/DashboardPrimitives";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { RatingDistributionChart } from "./components/RatingDistributionChart";
import { RatingRadarChart } from "./components/RatingRadarChart";
import { TopNamesChart } from "./components/TopNamesChart";
import { WinLossChart } from "./components/WinLossChart";
import type { DashboardTimeframe } from "./hooks/useDashboardData";
import { useDashboardData } from "./hooks/useDashboardData";
import { PersonalResults } from "./PersonalResults";

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

function getQuickStats({
	siteStats,
	userName,
	userStats,
}: {
	siteStats: SiteStats | null;
	userName: string;
	userStats: UserStats | null;
}): QuickStat[] {
	if (userName && userStats) {
		return [
			{ label: "Ratings", value: userStats.totalRatings, icon: BarChart3 },
			{ label: "Selected", value: userStats.totalSelections, icon: Target },
			{
				label: "Wins",
				value: userStats.totalWins,
				icon: Trophy,
				accent: true,
			},
			{
				label: "Win rate",
				value: `${userStats.winRate}%`,
				icon: TrendingUp,
				accent: true,
			},
		];
	}

	if (siteStats) {
		return [
			{
				label: "Total names",
				value: siteStats.totalNames,
				icon: Activity,
			},
			{
				label: "Active names",
				value: siteStats.activeNames,
				icon: Target,
			},
			{ label: "Users", value: siteStats.totalUsers, icon: Users },
			{
				label: "Average rating",
				value: Math.round(siteStats.avgRating),
				icon: TrendingUp,
				accent: true,
			},
		];
	}

	return [];
}

const DashboardHeader = memo(function DashboardHeader({
	isLoggedIn,
	userName,
	avatarUrl,
	isAdmin,
	quickStats,
	userStats,
}: {
	isLoggedIn: boolean;
	userName: string;
	avatarUrl?: string;
	isAdmin: boolean;
	quickStats: QuickStat[];
	userStats: UserStats | null;
}) {
	if (!isLoggedIn && quickStats.length === 0) {
		return null;
	}

	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_1fr]">
			{isLoggedIn && userName && (
				<Panel>
					<div className="flex items-center gap-4">
						<div className="relative">
							{avatarUrl ? (
								<img
									src={avatarUrl}
									alt={userName}
									className={`size-16 rounded-full object-cover ring-2 ring-primary/20 ${themeSurfaces.avatar}`}
								/>
							) : (
								<div
									className={`flex size-16 items-center justify-center rounded-full ring-2 ring-primary/20 text-primary ${themeSurfaces.avatar}`}
								>
									<User size={22} />
								</div>
							)}
							{isAdmin && (
								<div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 p-1">
									<div className="rounded-full bg-card p-0.5">
										<span className="text-xs font-bold">👑</span>
									</div>
								</div>
							)}
						</div>
						<div className="min-w-0">
							<p className={themeText.eyebrowWide}>Profile</p>
							<h2 className="mt-2 truncate text-2xl font-semibold text-foreground">{userName}</h2>
							<p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground/75">
								<span>{isAdmin ? "👤 Administrator" : "🎮 Tournament participant"}</span>
							</p>
						</div>
					</div>
				</Panel>
			)}

			{quickStats.length > 0 && (
				<Panel>
					<SectionHeader
						icon={BarChart3}
						title={userStats ? "Your Snapshot" : "Community Snapshot"}
						subtitle={userStats ? "Your totals." : "Pool totals."}
					/>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						{quickStats.map((item) => (
							<StatTile
								key={item.label}
								label={item.label}
								value={item.value}
								icon={item.icon}
								accent={Boolean(item.accent)}
							/>
						))}
					</div>
				</Panel>
			)}
		</div>
	);
});

const CommunityChartsPanel = memo(function CommunityChartsPanel({
	leaderboard,
	siteStats,
}: {
	leaderboard: typeof leaderboard extends any[] ? typeof leaderboard : NameItem[];
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

const TIMEFRAME_OPTIONS = [
	{ value: "day" as const, label: "24h" },
	{ value: "week" as const, label: "Week" },
	{ value: "month" as const, label: "Month" },
] as const;

const EngagementPanel = memo(function EngagementPanel({
	engagementMetrics,
	timeframe,
	setTimeframe,
	refreshEngagementMetrics,
	isLoadingEngagement,
}: {
	engagementMetrics: typeof engagementMetrics;
	timeframe: DashboardTimeframe;
	setTimeframe: (tf: DashboardTimeframe) => void;
	refreshEngagementMetrics: () => void;
	isLoadingEngagement: boolean;
}) {
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
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
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
				transition={{ duration: 0.4, delay: 0.1 }}
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
	const quickStats = getQuickStats({ siteStats, userName, userStats });
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
