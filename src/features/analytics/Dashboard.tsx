import {
	Activity,
	BarChart3,
	Eye,
	EyeOff,
	Target,
	TrendingUp,
	Trophy,
	User,
	Users,
} from "lucide-react";
import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import type { SiteStats, UserStats } from "@/shared/services/supabase/statsService";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel, SectionHeader, StatTile } from "./components/DashboardPrimitives";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { type QuickStat } from "./components/QuickStatsPanel";
import { RatingDistributionChart } from "./components/RatingDistributionChart";
import { RatingRadarChart } from "./components/RatingRadarChart";
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

// Extracted Components

function DashboardHeader({
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
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt={userName}
								className="size-16 rounded-full border border-white/10 object-cover"
							/>
						) : (
							<div className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary">
								<User size={22} />
							</div>
						)}
						<div className="min-w-0">
							<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/65">
								Profile
							</p>
							<h2 className="mt-2 truncate text-2xl font-semibold text-foreground">{userName}</h2>
							<p className="mt-1 text-sm text-muted-foreground/75">
								{isAdmin ? "Administrator" : "Tournament participant"}
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
}

function CommunityChartsPanel({
	leaderboard,
	siteStats,
}: {
	leaderboard: any[];
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
}

function EngagementPanel({
	engagementMetrics,
	timeframe,
	setTimeframe,
	refreshEngagementMetrics,
	isLoadingEngagement,
}: {
	engagementMetrics: any;
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

function AdminPanel({
	isAdmin,
	showHiddenNames,
	toggleHiddenNames,
	hiddenNames,
	handleUnhideName,
}: {
	isAdmin: boolean;
	showHiddenNames: boolean;
	toggleHiddenNames: () => void;
	hiddenNames: any[];
	handleUnhideName: (id: string) => void;
}) {
	if (!isAdmin) {
		return null;
	}

	return (
		<Panel>
			<SectionHeader
				icon={EyeOff}
				title="Hidden Names"
				subtitle="Hidden from the pool."
				action={
					<Button variant="outline" size="small" onClick={toggleHiddenNames}>
						{showHiddenNames ? "Hide List" : "Show List"}
					</Button>
				}
			/>
			{showHiddenNames ? (
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
					{hiddenNames.length > 0 ? (
						hiddenNames.map((name, index) => (
							<div
								key={name.id}
								className={`flex items-center justify-between gap-3 px-4 py-3 ${
									index < hiddenNames.length - 1 ? "border-b border-white/10" : ""
								}`}
							>
								<span className="text-sm font-medium text-foreground">{name.name}</span>
								<Button variant="ghost" size="small" onClick={() => handleUnhideName(name.id)}>
									<Eye size={14} />
									Unhide
								</Button>
							</div>
						))
					) : (
						<EmptyState variant="inline" title="No hidden names." />
					)}
				</div>
			) : (
				<EmptyState
					variant="box"
					title="Open the list to review and restore hidden names."
					className="border-dashed bg-black/10"
				/>
			)}
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
	const quickStats = getQuickStats({ siteStats, userName, userStats });
	const hasPersonalRatings = Boolean(personalRatings && Object.keys(personalRatings).length > 0);
	const hasCommunityData = leaderboard.length > 0 || Boolean(siteStats);
	const shouldShowDashboardPrimer =
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

				<CommunityChartsPanel leaderboard={leaderboard} siteStats={siteStats} />
			</div>

			<EngagementPanel
				engagementMetrics={engagementMetrics}
				timeframe={timeframe}
				setTimeframe={setTimeframe}
				refreshEngagementMetrics={refreshEngagementMetrics}
				isLoadingEngagement={isLoadingEngagement}
			/>

			<AdminPanel
				isAdmin={isAdmin}
				showHiddenNames={showHiddenNames}
				toggleHiddenNames={toggleHiddenNames}
				hiddenNames={hiddenNames}
				handleUnhideName={handleUnhideName}
			/>
		</div>
	);
}
