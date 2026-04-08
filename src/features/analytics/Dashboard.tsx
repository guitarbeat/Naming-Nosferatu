import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { leaderboardAPI, statsAPI } from "@/features/analytics/services/analyticsService";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import {
	Activity,
	BarChart3,
	Clock,
	Eye,
	EyeOff,
	Target,
	TrendingUp,
	Trophy,
	User,
	Users,
} from "@/shared/lib/icons";
import { coreAPI, hiddenNamesAPI } from "@/shared/services/supabase/api";
import type { NameItem, RatingData } from "@/shared/types";
import { RandomGenerator } from "../tournament/components/RandomGenerator";
import { RatingDistributionChart } from "./components/RatingDistributionChart";
import { RatingRadarChart } from "./components/RatingRadarChart";
import { TopNamesChart } from "./components/TopNamesChart";
import { WinLossChart } from "./components/WinLossChart";
import { PersonalResults } from "./PersonalResults";

// ============================================================================
// TYPES
// ============================================================================

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

interface EngagementMetrics {
	totalTournaments: number;
	completedTournaments: number;
	averageTournamentTime: number;
	totalMatches: number;
	peakActiveUsers: number;
	dailyActiveUsers: number;
	weeklyActiveUsers: number;
	monthlyActiveUsers: number;
	mostActiveHour: string;
	mostActiveDay: string;
	userRetentionRate: number;
	averageSessionDuration: number;
	totalPageViews: number;
	bounceRate: number;
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
	label,
	value,
	icon: Icon,
	accent = false,
}: {
	label: string;
	value: string | number;
	icon?: React.ElementType;
	accent?: boolean;
}) {
	return (
		<div className="group relative rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-4 transition-all duration-200 ease-out hover:bg-card/60 hover:border-border/50 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5">
			<div className="flex items-start gap-3">
				{Icon && (
					<div className={`rounded-lg p-2 transition-all duration-200 ${accent ? "bg-primary/15 text-primary group-hover:bg-primary/20 group-hover:scale-110" : "bg-muted/50 text-muted-foreground group-hover:bg-muted/70 group-hover:scale-110"}`}>
						<Icon size={16} />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<p className="text-xs font-medium text-muted-foreground mb-1 transition-colors duration-200 group-hover:text-muted-foreground/80">{label}</p>
					<p className={`text-xl font-bold tabular-nums transition-colors duration-200 ${accent ? "text-primary group-hover:text-primary/90" : "text-foreground"}`}>
						{value}
					</p>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
	icon: Icon,
	title,
	action,
}: {
	icon: React.ElementType;
	title: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex items-center gap-2.5">
				<Icon size={18} className="text-primary" />
				<h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
			</div>
			{action}
		</div>
	);
}

// ============================================================================
// DASHBOARD
// ============================================================================

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
	const [leaderboard, setLeaderboard] = useState<
		Array<{
			name: string;
			avg_rating: number;
			wins: number;
			total_ratings: number;
		}>
	>([]);
	const [siteStats, setSiteStats] = useState<{
		totalNames: number;
		activeNames: number;
		hiddenNames: number;
		totalUsers: number;
		totalRatings: number;
		totalSelections: number;
		avgRating: number;
	} | null>(null);
	const [userStats, setUserStats] = useState<{
		totalRatings: number;
		totalSelections: number;
		totalWins: number;
		winRate: number;
	} | null>(null);
	const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
	const [_isLoadingStats, setIsLoadingStats] = useState(true);
	const [hiddenNames, setHiddenNames] = useState<Array<{ id: string | number; name: string }>>([]);
	const [showHiddenNames, setShowHiddenNames] = useState(false);
	const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
	const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");

	useEffect(() => {
		const fetchLeaderboard = async () => {
			setIsLoadingLeaderboard(true);
			try {
				const data = await leaderboardAPI.getLeaderboard(10);
				setLeaderboard(data);
			} catch (error) {
				console.error("Failed to fetch leaderboard:", error);
			} finally {
				setIsLoadingLeaderboard(false);
			}
		};
		fetchLeaderboard();
	}, []);

	const fetchEngagementMetrics = useCallback(async () => {
		setIsLoadingStats(true);
		try {
			const metrics = await statsAPI.getEngagementMetrics(timeframe);
			setEngagementMetrics(metrics);
		} catch (error) {
			console.error("Failed to fetch engagement metrics:", error);
		} finally {
			setIsLoadingStats(false);
		}
	}, [timeframe]);

	useEffect(() => {
		fetchEngagementMetrics();
	}, [fetchEngagementMetrics]);

	useEffect(() => {
		const fetchStats = async () => {
			setIsLoadingStats(true);
			try {
				const [site, user] = await Promise.all([
					statsAPI.getSiteStats(),
					userName ? statsAPI.getUserStats(userName) : Promise.resolve(null),
				]);
				if (site) {
					setSiteStats({
						totalNames: site.totalNames || 0,
						activeNames: site.activeNames || 0,
						hiddenNames: site.hiddenNames || 0,
						totalUsers: site.totalUsers || 0,
						totalRatings: site.totalRatings || 0,
						totalSelections: site.totalSelections || 0,
						avgRating: site.avgRating || 0,
					});
				}
				setUserStats(user);
			} catch (error) {
				console.error("Failed to fetch stats:", error);
			} finally {
				setIsLoadingStats(false);
			}
		};
		fetchStats();
	}, [userName]);

	useEffect(() => {
		if (isAdmin && showHiddenNames) {
			const fetchHidden = async () => {
				try {
					const data = await hiddenNamesAPI.getHiddenNames();
					setHiddenNames(data);
				} catch (error) {
					console.error("Failed to fetch hidden names:", error);
				}
			};
			fetchHidden();
		}
	}, [isAdmin, showHiddenNames]);

	const handleUnhideName = async (nameId: string | number) => {
		if (!userName) return;
		try {
			const result = await hiddenNamesAPI.unhideName(userName, nameId);
			if (!result.success) throw new Error(result.error || "Failed to unhide name");
			setHiddenNames((prev) => prev.filter((n) => n.id !== nameId));
		} catch (error) {
			console.error("Failed to unhide name:", error);
		}
	};

	return (
		<div className="dashboard-container space-y-8 sm:space-y-10 w-full">

			{/* ── User Profile ── */}
			{isLoggedIn && userName && (
				<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-5 sm:p-6">
					<div className="flex items-center gap-4">
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt={userName}
								className="size-14 rounded-full object-cover ring-2 ring-primary/20 ring-offset-2 ring-offset-card"
							/>
						) : (
							<div className="size-14 rounded-full bg-primary/10 ring-2 ring-primary/20 ring-offset-2 ring-offset-card flex items-center justify-center">
								<User size={22} className="text-primary" />
							</div>
						)}
						<div className="flex-1 min-w-0">
							<h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">{userName}</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								{isAdmin ? "Administrator" : "Tournament Participant"}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* ── Personal Results ── */}
			{personalRatings && Object.keys(personalRatings).length > 0 && onUpdateRatings && (
				<PersonalResults
					personalRatings={personalRatings}
					currentTournamentNames={currentTournamentNames}
					onStartNew={onStartNew || (() => {})}
					onUpdateRatings={onUpdateRatings}
					userName={userName}
				/>
			)}

			{/* ── Random Generator ── */}
			<div>
				<Suspense fallback={<div className="p-4">Loading...</div>}>
					<RandomGenerator fetchNames={() => coreAPI.getTrendingNames(false)} />
				</Suspense>
			</div>

			{/* ── Your Stats ── */}
			{userName && userStats && (
				<div>
					<SectionHeader icon={BarChart3} title="Your Stats" />
					<div className="grid grid-cols-2 gap-3">
						<StatCard label="Ratings" value={userStats.totalRatings} icon={BarChart3} />
						<StatCard label="Selected" value={userStats.totalSelections} icon={Target} />
						<StatCard label="Wins" value={userStats.totalWins} icon={Trophy} accent />
						<StatCard label="Win Rate" value={`${userStats.winRate}%`} icon={TrendingUp} accent />
					</div>
				</div>
			)}

			{/* ── Global Leaderboard ── */}
			<div>
				<SectionHeader
					icon={Trophy}
					title="Top Names"
					action={
						onStartNew ? (
							<Button variant="ghost" size="small" onClick={onStartNew}>
								New Tournament
							</Button>
						) : undefined
					}
				/>

				{isLoadingLeaderboard ? (
					<Loading variant="skeleton" height={300} />
				) : leaderboard.length > 0 ? (
					<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm overflow-hidden">
						{leaderboard.map((entry, index) => (
							<div
								key={entry.name}
								className={`flex items-center gap-3 sm:gap-4 px-4 py-3 transition-colors hover:bg-foreground/[0.03] ${index < leaderboard.length - 1 ? "border-b border-border/20" : ""}`}
							>
								<div
									className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center text-sm font-bold ${
										index === 0
											? "bg-chart-4/20 text-chart-4 ring-1 ring-chart-4/30"
											: index === 1
												? "bg-secondary/30 text-secondary-foreground"
												: index === 2
													? "bg-chart-1/20 text-chart-1"
													: "bg-muted/50 text-muted-foreground"
									}`}
								>
									{index + 1}
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-foreground text-sm truncate">{entry.name}</p>
									<p className="text-[11px] text-muted-foreground">
										{entry.total_ratings} rating{entry.total_ratings !== 1 ? "s" : ""} · {entry.wins} win{entry.wins !== 1 ? "s" : ""}
									</p>
								</div>
								<div className="text-right flex-shrink-0">
									<p className="text-base font-bold text-primary tabular-nums">{Math.round(entry.avg_rating)}</p>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-8 text-center">
						<p className="text-sm text-muted-foreground">No ratings yet. Start a tournament!</p>
					</div>
				)}
			</div>

			{/* ── Charts ── */}
			{leaderboard.length > 0 && (
				<>
					<div>
						<SectionHeader icon={BarChart3} title="Top Names by Rating" />
						<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-4">
							<TopNamesChart leaderboard={leaderboard} />
						</div>
					</div>

					<div>
						<SectionHeader icon={TrendingUp} title="Win / Loss Breakdown" />
						<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-4">
							<WinLossChart leaderboard={leaderboard} />
						</div>
					</div>

					<div>
						<SectionHeader icon={Activity} title="Rating Distribution" />
						<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-4">
							<RatingDistributionChart leaderboard={leaderboard} />
						</div>
					</div>

					{leaderboard.length >= 3 && (
						<div>
							<SectionHeader icon={Target} title="Name Comparison Radar" />
							<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-4">
								<RatingRadarChart leaderboard={leaderboard} />
							</div>
						</div>
					)}
				</>
			)}

			{/* ── Site Statistics ── */}
			{siteStats && (
				<div>
					<SectionHeader icon={BarChart3} title="Site Statistics" />
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						<StatCard label="Total Names" value={siteStats.totalNames} icon={Activity} />
						<StatCard label="Active Names" value={siteStats.activeNames} icon={Target} />
						<StatCard label="Total Users" value={siteStats.totalUsers} icon={Users} />
						<StatCard label="Avg Rating" value={Math.round(siteStats.avgRating)} icon={TrendingUp} accent />
						{isAdmin && (
							<StatCard label="Hidden Names" value={siteStats.hiddenNames} icon={EyeOff} />
						)}
					</div>
				</div>
			)}

			{/* ── Engagement Metrics ── */}
			{engagementMetrics && (
				<div>
					<SectionHeader
						icon={TrendingUp}
						title="Engagement"
						action={
							<div className="flex gap-2">
								<select
									value={timeframe}
									onChange={(e) => setTimeframe(e.target.value as "day" | "week" | "month")}
									className="px-2.5 py-1.5 border border-border/40 rounded-lg bg-card/60 text-foreground text-xs backdrop-blur-sm"
								>
									<option value="day">24h</option>
									<option value="week">Week</option>
									<option value="month">Month</option>
								</select>
								<Button
									variant="ghost"
									size="small"
									onClick={() => fetchEngagementMetrics()}
									disabled={_isLoadingStats}
								>
									<Activity size={14} className="mr-1" />
									Refresh
								</Button>
							</div>
						}
					/>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
						<StatCard label="Tournaments" value={engagementMetrics.totalTournaments} icon={Users} />
						<StatCard label="Completed" value={engagementMetrics.completedTournaments} icon={Trophy} accent />
						<StatCard label="Avg Duration" value={`${engagementMetrics.averageTournamentTime}m`} icon={Clock} />
						<StatCard label="Peak Users" value={engagementMetrics.peakActiveUsers} icon={Target} />
						<StatCard label="Retention" value={`${engagementMetrics.userRetentionRate}%`} icon={Activity} accent />
						<StatCard label="Bounce Rate" value={`${engagementMetrics.bounceRate}%`} icon={BarChart3} />
						<StatCard label="Daily Active" value={engagementMetrics.dailyActiveUsers} icon={Users} />
						<StatCard label="Weekly Active" value={engagementMetrics.weeklyActiveUsers} icon={Users} />
						<StatCard label="Monthly Active" value={engagementMetrics.monthlyActiveUsers} icon={Users} />
					</div>
				</div>
			)}

			{/* ── Admin: Hidden Names ── */}
			{isAdmin && (
				<div>
					<SectionHeader
						icon={EyeOff}
						title="Hidden Names"
						action={
							<Button
								variant="ghost"
								size="small"
								onClick={() => setShowHiddenNames(!showHiddenNames)}
							>
								{showHiddenNames ? "Hide List" : "Show List"}
							</Button>
						}
					/>

					{showHiddenNames && (
						<div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm overflow-hidden">
							{hiddenNames.length > 0 ? (
								hiddenNames.map((name, i) => (
									<div
										key={name.id}
										className={`flex items-center justify-between px-4 py-3 ${i < hiddenNames.length - 1 ? "border-b border-border/20" : ""}`}
									>
										<span className="text-sm font-medium text-foreground">{name.name}</span>
										<Button
											variant="ghost"
											size="small"
											onClick={() => handleUnhideName(name.id)}
										>
											<Eye size={14} className="mr-1" />
											Unhide
										</Button>
									</div>
								))
							) : (
								<p className="text-center text-sm text-muted-foreground py-6">No hidden names</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
