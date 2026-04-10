import type { ElementType, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
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
import { hiddenNamesAPI } from "@/shared/services/supabase/api";
import type { NameItem, RatingData } from "@/shared/types";
import { RatingDistributionChart } from "./components/RatingDistributionChart";
import { RatingRadarChart } from "./components/RatingRadarChart";
import { TopNamesChart } from "./components/TopNamesChart";
import { WinLossChart } from "./components/WinLossChart";
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

function Panel({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={`rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(4,10,20,0.14)] backdrop-blur-xl sm:p-6 ${className}`}
		>
			{children}
		</section>
	);
}

function StatTile({
	label,
	value,
	icon: Icon,
	accent = false,
}: {
	label: string;
	value: string | number;
	icon?: ElementType;
	accent?: boolean;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
						{label}
					</p>
					<p className={`mt-2 text-2xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
						{value}
					</p>
				</div>
				{Icon && (
					<div
						className={`rounded-2xl border p-2.5 ${
							accent
								? "border-primary/20 bg-primary/12 text-primary"
								: "border-white/10 bg-white/[0.04] text-white/65"
						}`}
					>
						<Icon size={16} />
					</div>
				)}
			</div>
		</div>
	);
}

function SectionHeader({
	icon: Icon,
	title,
	subtitle,
	action,
}: {
	icon: ElementType;
	title: string;
	subtitle?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div className="space-y-2">
				<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
					<Icon size={14} className="text-primary" />
					<span>{title}</span>
				</div>
				{subtitle && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">{subtitle}</p>}
			</div>
			{action}
		</div>
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
	const [isLoadingStats, setIsLoadingStats] = useState(true);
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
		if (!userName) {
			return;
		}
		try {
			const result = await hiddenNamesAPI.unhideName(userName, nameId);
			if (!result.success) {
				throw new Error(result.error || "Failed to unhide name");
			}
			setHiddenNames((prev) => prev.filter((name) => name.id !== nameId));
		} catch (error) {
			console.error("Failed to unhide name:", error);
		}
	};

	const quickStats = userName && userStats
		? [
				{ label: "Ratings", value: userStats.totalRatings, icon: BarChart3 },
				{ label: "Selected", value: userStats.totalSelections, icon: Target },
				{ label: "Wins", value: userStats.totalWins, icon: Trophy, accent: true },
				{ label: "Win rate", value: `${userStats.winRate}%`, icon: TrendingUp, accent: true },
			]
		: siteStats
			? [
					{ label: "Total names", value: siteStats.totalNames, icon: Activity },
					{ label: "Active names", value: siteStats.activeNames, icon: Target },
					{ label: "Users", value: siteStats.totalUsers, icon: Users },
					{ label: "Average rating", value: Math.round(siteStats.avgRating), icon: TrendingUp, accent: true },
				]
			: [];

	return (
		<div className="w-full space-y-8 sm:space-y-10">
			{(isLoggedIn || quickStats.length > 0) && (
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
								subtitle={
									userStats
										? "Your latest tournament totals, selection habits, and head-to-head performance."
										: "A quick read on how the naming pool is performing across the site."
								}
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
			)}

			{personalRatings && Object.keys(personalRatings).length > 0 && onUpdateRatings && (
				<Panel>
					<SectionHeader
						icon={Trophy}
						title="Your Rankings"
						subtitle="Adjust your personal order, save changes, or jump straight into another run."
					/>
					<PersonalResults
						personalRatings={personalRatings}
						currentTournamentNames={currentTournamentNames}
						onStartNew={onStartNew || (() => {})}
						onUpdateRatings={onUpdateRatings}
						userName={userName}
					/>
				</Panel>
			)}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
				<Panel>
					<SectionHeader
						icon={Trophy}
						title="Leaderboard"
						subtitle="The ten names with the strongest average ratings right now."
						action={
							onStartNew ? (
								<Button variant="outline" size="small" onClick={onStartNew}>
									New Tournament
								</Button>
							) : undefined
						}
					/>

					{isLoadingLeaderboard ? (
						<Loading variant="skeleton" height={320} />
					) : leaderboard.length > 0 ? (
						<div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
							{leaderboard.map((entry, index) => (
								<div
									key={entry.name}
									className={`flex items-center gap-3 px-4 py-3 ${
										index < leaderboard.length - 1 ? "border-b border-white/10" : ""
									}`}
								>
									<div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-foreground">
										{index + 1}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-foreground">{entry.name}</p>
										<p className="text-xs text-muted-foreground/70">
											{entry.total_ratings} rating{entry.total_ratings !== 1 ? "s" : ""} •{" "}
											{entry.wins} win{entry.wins !== 1 ? "s" : ""}
										</p>
									</div>
									<div className="text-right">
										<p className="text-lg font-semibold text-primary">
											{Math.round(entry.avg_rating)}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-8 text-center text-sm text-muted-foreground/75">
							No ratings yet. Start a tournament to create the first leaderboard.
						</div>
					)}
				</Panel>

				<div className="grid gap-6">
					{leaderboard.length > 0 && (
						<>
							<div className="grid gap-6 xl:grid-cols-2">
								<Panel>
									<SectionHeader
										icon={BarChart3}
										title="Top Names by Rating"
										subtitle="A quick comparison of the names leading the pack."
									/>
									<TopNamesChart leaderboard={leaderboard} />
								</Panel>

								<Panel>
									<SectionHeader
										icon={TrendingUp}
										title="Win and Loss Breakdown"
										subtitle="How each top name is converting matchups into wins."
									/>
									<WinLossChart leaderboard={leaderboard} />
								</Panel>
							</div>

							<div className="grid gap-6 xl:grid-cols-2">
								<Panel>
									<SectionHeader
										icon={Activity}
										title="Rating Distribution"
										subtitle="See how tightly clustered or spread the current scores are."
									/>
									<RatingDistributionChart leaderboard={leaderboard} />
								</Panel>

								{leaderboard.length >= 3 && (
									<Panel>
										<SectionHeader
											icon={Target}
											title="Comparison Radar"
											subtitle="A relative look at how the top names stack up against each other."
										/>
										<RatingRadarChart leaderboard={leaderboard} />
									</Panel>
								)}
							</div>
						</>
					)}

					{siteStats && (
						<Panel>
							<SectionHeader
								icon={Users}
								title="Site Statistics"
								subtitle="High-level activity totals for the overall naming pool."
							/>
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
			</div>

			{engagementMetrics && (
				<Panel>
					<SectionHeader
						icon={TrendingUp}
						title="Engagement"
						subtitle="A read on tournament completion, usage frequency, and session quality."
						action={
							<div className="flex items-center gap-2">
								<select
									value={timeframe}
									onChange={(event) => setTimeframe(event.target.value as "day" | "week" | "month")}
									className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm text-foreground"
								>
									<option value="day">24 hours</option>
									<option value="week">Week</option>
									<option value="month">Month</option>
								</select>
								<Button
									variant="outline"
									size="small"
									onClick={() => fetchEngagementMetrics()}
									disabled={isLoadingStats}
								>
									<Activity size={14} />
									Refresh
								</Button>
							</div>
						}
					/>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<StatTile label="Tournaments" value={engagementMetrics.totalTournaments} icon={Users} />
						<StatTile
							label="Completed"
							value={engagementMetrics.completedTournaments}
							icon={Trophy}
							accent={true}
						/>
						<StatTile
							label="Avg duration"
							value={`${engagementMetrics.averageTournamentTime}m`}
							icon={Clock}
						/>
						<StatTile label="Peak users" value={engagementMetrics.peakActiveUsers} icon={Target} />
						<StatTile
							label="Retention"
							value={`${engagementMetrics.userRetentionRate}%`}
							icon={Activity}
							accent={true}
						/>
						<StatTile
							label="Bounce rate"
							value={`${engagementMetrics.bounceRate}%`}
							icon={BarChart3}
						/>
						<StatTile label="Daily active" value={engagementMetrics.dailyActiveUsers} icon={Users} />
						<StatTile label="Weekly active" value={engagementMetrics.weeklyActiveUsers} icon={Users} />
					</div>
				</Panel>
			)}

			{isAdmin && (
				<Panel>
					<SectionHeader
						icon={EyeOff}
						title="Hidden Names"
						subtitle="Review names that are currently removed from the public pool."
						action={
							<Button
								variant="outline"
								size="small"
								onClick={() => setShowHiddenNames(!showHiddenNames)}
							>
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
								<div className="px-4 py-8 text-center text-sm text-muted-foreground/75">
									No hidden names.
								</div>
							)}
						</div>
					) : (
						<div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-muted-foreground/75">
							Open the list to review and restore hidden names.
						</div>
					)}
				</Panel>
			)}
		</div>
	);
}
