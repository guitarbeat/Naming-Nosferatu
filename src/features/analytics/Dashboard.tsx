import Button from "@/shared/components/layout/Button";
import { Activity, BarChart3, Target, TrendingUp, Trophy, Users } from "@/shared/lib/icons";
import type { SiteStats, UserStats } from "@/shared/services/supabase/statsService";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel, SectionHeader } from "./components/DashboardPrimitives";
import { HiddenNamesPanel } from "./components/HiddenNamesPanel";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { ProfilePanel } from "./components/ProfilePanel";
import { type QuickStat, QuickStatsPanel } from "./components/QuickStatsPanel";
import { RatingDistributionChart } from "./components/RatingDistributionChart";
import { RatingRadarChart } from "./components/RatingRadarChart";
import { RecentActivityPanel } from "./components/RecentActivityPanel";
import { SiteStatsPanel } from "./components/SiteStatsPanel";
import { TopNamesChart } from "./components/TopNamesChart";
import { WinLossChart } from "./components/WinLossChart";
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

function DashboardEmptyState({
	isLoggedIn,
	onStartNew,
}: {
	isLoggedIn: boolean;
	onStartNew?: () => void;
}) {
	return (
		<Panel className="border-dashed bg-black/10">
			<SectionHeader
				icon={BarChart3}
				title="Nothing Ranked Yet"
				subtitle={isLoggedIn ? "Run a bracket to start." : "Run a bracket to begin."}
				action={
					onStartNew ? (
						<Button variant="outline" size="small" onClick={onStartNew}>
							Start Tournament
						</Button>
					) : undefined
				}
			/>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
						Personal Layer
					</p>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">Your saved order.</p>
				</div>
				<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
						Community Layer
					</p>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">
						Aggregate site stats.
					</p>
				</div>
			</div>
		</Panel>
	);
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
		handleUnhideName,
		hiddenNames,
		isLoadingEngagement,
		isLoadingLeaderboard,
		leaderboard,
		refreshEngagementMetrics,
		setTimeframe,
		showHiddenNames,
		siteStats,
		timeframe,
		toggleHiddenNames,
		userStats,
	} = useDashboardData({ isAdmin, userName });
	const quickStats = getQuickStats({ siteStats, userName, userStats }) as QuickStat[];
	const hasPersonalRatings = Boolean(personalRatings && Object.keys(personalRatings).length > 0);
	const hasCommunityData = leaderboard.length > 0 || Boolean(siteStats);
	const shouldShowDashboardPrimer =
		!hasPersonalRatings && !isLoadingLeaderboard && !hasCommunityData;

	return (
		<div className="w-full space-y-8 sm:space-y-10">
			{(isLoggedIn || quickStats.length > 0) && (
				<div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_1fr]">
					{isLoggedIn && userName && (
						<ProfilePanel userName={userName} isAdmin={isAdmin} avatarUrl={avatarUrl} />
					)}

					{quickStats.length > 0 && (
						<QuickStatsPanel quickStats={quickStats} isUserSnapshot={Boolean(userStats)} />
					)}
				</div>
			)}

			{shouldShowDashboardPrimer && (
				<DashboardEmptyState isLoggedIn={isLoggedIn} onStartNew={onStartNew} />
			)}

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

				<div className="grid gap-6">
					{leaderboard.length > 0 && (
						<>
							<div className="grid gap-6 xl:grid-cols-2">
								<Panel>
									<SectionHeader
										icon={BarChart3}
										title="Top Names by Rating"
										subtitle="Top scores."
									/>
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
									<SectionHeader
										icon={Activity}
										title="Rating Distribution"
										subtitle="Score spread."
									/>
									<RatingDistributionChart leaderboard={leaderboard} />
								</Panel>

								{leaderboard.length >= 3 && (
									<Panel>
										<SectionHeader
											icon={Target}
											title="Comparison Radar"
											subtitle="Side by side."
										/>
										<RatingRadarChart leaderboard={leaderboard} />
									</Panel>
								)}
							</div>
						</>
					)}

					<SiteStatsPanel siteStats={siteStats} />
				</div>
			</div>

			<RecentActivityPanel
				engagementMetrics={engagementMetrics}
				timeframe={timeframe}
				setTimeframe={setTimeframe}
				refreshEngagementMetrics={refreshEngagementMetrics}
				isLoadingEngagement={isLoadingEngagement}
			/>

			<HiddenNamesPanel
				isAdmin={isAdmin}
				showHiddenNames={showHiddenNames}
				toggleHiddenNames={toggleHiddenNames}
				hiddenNames={hiddenNames}
				handleUnhideName={handleUnhideName}
			/>
		</div>
	);
}
