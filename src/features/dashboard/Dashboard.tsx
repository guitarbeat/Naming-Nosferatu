import { BarChart3, Settings, TrendingUp, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { memo, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Button, Card, Loading, MagicToggle } from "@/shared/components/LayoutBlocks";
import { useAdminDashboard, useDashboardData } from "./hooks";
import type { DashboardProps } from "./types";
import { getQuickStats } from "./utils";

export function AdminDashboard() {
	const { isLoading, filteredNames } = useAdminDashboard();

	if (isLoading) {
		return <Loading />;
	}

	return (
		<div className="p-4 bg-card rounded-xl">Admin Dashboard: {filteredNames.length} names</div>
	);
}

export function ContextBadge({ label, tone = "accent" }: { label: string; tone?: string }) {
	return <span className={`text-xs px-2 py-1 rounded bg-${tone}/20 text-${tone}`}>{label}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
	return (
		<Card className={className} padding="medium">
			{children}
		</Card>
	);
}

export function SectionHeader({
	icon: Icon,
	title,
	subtitle,
	action,
}: {
	icon: any;
	title: string;
	subtitle?: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex items-center gap-2">
				{Icon && <Icon className="w-5 h-5 text-primary" />}
				<div>
					<h3 className="text-lg font-semibold">{title}</h3>
					{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
				</div>
			</div>
			{action}
		</div>
	);
}

export function CommunityChartsPanel({ leaderboard, _siteStats }: any) {
	const data = (leaderboard || []).slice(0, 5).map((l: any) => ({
		name: l.name,
		rating: Math.round(l.avg_rating),
	}));

	return (
		<Panel className="flex flex-col gap-4">
			<SectionHeader icon={BarChart3} title="Top Ratings" subtitle="Highest Elo ratings" />
			<div className="h-64 flex items-center justify-center text-muted-foreground w-full">
				{data.length ? (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.1)"
								vertical={false}
							/>
							<XAxis
								dataKey="name"
								stroke="rgba(255,255,255,0.5)"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="rgba(255,255,255,0.5)"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								domain={["dataMin - 100", "dataMax + 100"]}
							/>
							<Tooltip
								cursor={{ fill: "rgba(255,255,255,0.05)" }}
								contentStyle={{
									backgroundColor: "var(--card)",
									borderColor: "rgba(255,255,255,0.1)",
									borderRadius: "8px",
								}}
								itemStyle={{ color: "var(--primary)" }}
							/>
							<Bar dataKey="rating" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
						</BarChart>
					</ResponsiveContainer>
				) : (
					"No data available"
				)}
			</div>
		</Panel>
	);
}

export function DashboardHeader({
	_isLoggedIn,
	_userName,
	_avatarUrl,
	_isAdmin,
	quickStats,
	_userStats,
}: any) {
	return (
		<div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<h1 className="text-3xl font-display font-black tracking-tight text-foreground">Dashboard</h1>
			<div className="flex flex-wrap gap-4">
				{quickStats?.map((stat: any) => (
					<div key={stat.label} className="flex flex-col items-end">
						<span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
							{stat.label}
						</span>
						<span className="text-xl font-bold text-foreground">{stat.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}

const TIMEFRAME_OPTIONS = [
	{ value: "day", label: "Day" },
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
] as const;

export function EngagementPanel({
	engagementMetrics,
	timeframe,
	setTimeframe,
	_refreshEngagementMetrics,
	isLoadingEngagement,
}: any) {
	const data = engagementMetrics?.dataPoints || [];

	return (
		<Panel>
			<SectionHeader
				icon={TrendingUp}
				title="Engagement"
				subtitle="Matches played over time"
				action={
					<MagicToggle
						options={TIMEFRAME_OPTIONS}
						value={timeframe}
						onChange={(val: any) => setTimeframe(val)}
						ariaLabel="Timeframe"
						size="small"
					/>
				}
			/>
			<div className="h-64 flex items-center justify-center w-full">
				{isLoadingEngagement ? (
					<Loading />
				) : data.length ? (
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="rgba(255,255,255,0.1)"
								vertical={false}
							/>
							<XAxis
								dataKey="label"
								stroke="rgba(255,255,255,0.5)"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="rgba(255,255,255,0.5)"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--card)",
									borderColor: "rgba(255,255,255,0.1)",
									borderRadius: "8px",
								}}
								itemStyle={{ color: "var(--accent)" }}
							/>
							<Line
								type="monotone"
								dataKey="value"
								stroke="var(--accent)"
								strokeWidth={3}
								dot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				) : (
					<span className="text-muted-foreground">No engagement data</span>
				)}
			</div>
		</Panel>
	);
}

export function LeaderboardPanel({ leaderboard, isLoadingLeaderboard, _onStartNew }: any) {
	return (
		<Panel>
			<SectionHeader icon={Trophy} title="Global Leaderboard" subtitle="Top community choices" />
			{isLoadingLeaderboard ? (
				<div className="py-8">
					<Loading />
				</div>
			) : (
				<div className="space-y-3 mt-2">
					{leaderboard?.slice(0, 10).map((l: any, i: number) => (
						<div
							key={l.name || i}
							className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
						>
							<div className="flex items-center gap-3">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
									{i + 1}
								</span>
								<span className="font-medium text-foreground">{l.name}</span>
							</div>
							<span className="font-mono text-sm font-bold text-accent">
								{Math.round(l.avg_rating)}
							</span>
						</div>
					))}
					{!leaderboard?.length && (
						<div className="text-center text-muted-foreground py-4">No rankings yet</div>
					)}
				</div>
			)}
		</Panel>
	);
}

export function PersonalResults({
	personalRatings,
	_currentTournamentNames,
	onStartNew,
	_onUpdateRatings,
	_userName,
}: any) {
	const sortedRatings = Object.entries(personalRatings || {}).sort(
		(a: any, b: any) => b[1].rating - a[1].rating,
	);

	return (
		<div className="space-y-6">
			<div className="text-sm text-muted-foreground mb-4">
				Your personal tier list based on previous choices.
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{sortedRatings.slice(0, 10).map(([name, data]: any, i) => (
					<div
						key={name}
						className="flex items-center justify-between p-3 bg-card border border-border/60 rounded-lg shadow-sm"
					>
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground text-xs font-bold">#{i + 1}</span>
							<span className="font-medium">{name}</span>
						</div>
						<span className="font-mono text-sm text-primary font-bold">
							{Math.round(data.rating)}
						</span>
					</div>
				))}
			</div>
			<div className="pt-4 border-t border-border/50">
				<Button onClick={onStartNew} className="w-full sm:w-auto">
					Start New Tournament
				</Button>
			</div>
		</div>
	);
}

type DashboardView = "analytics" | "admin";

// ⚡ Bolt Performance Optimization: Wrapped AnalyticsDashboard in React.memo()
const AnalyticsDashboard = memo(function AnalyticsDashboard({
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
	const quickStats = useMemo(() => getQuickStats({ siteStats, userStats }), [siteStats, userStats]);
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

const DASHBOARD_VIEW_OPTIONS = [
	{
		value: "analytics" as const,
		label: "Analytics",
		icon: <BarChart3 className="h-4 w-4" />,
	},
	{
		value: "admin" as const,
		label: "Admin",
		icon: <Settings className="h-4 w-4" />,
	},
];

interface UnifiedDashboardProps extends DashboardProps {
	isAdmin?: boolean;
}

// ⚡ Bolt Performance Optimization: Wrapped Dashboard in React.memo()
export const Dashboard = memo(function Dashboard(props: UnifiedDashboardProps) {
	const [activeView, setActiveView] = useState<DashboardView>("analytics");

	if (!props.isAdmin) {
		return (
			<div className="w-full space-y-6">
				<AnalyticsDashboard {...props} />
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			<div className="flex items-center gap-4 border-b border-border pb-4">
				<MagicToggle<DashboardView>
					options={DASHBOARD_VIEW_OPTIONS}
					value={activeView}
					onChange={(val: DashboardView) => setActiveView(val)}
					ariaLabel="Dashboard views"
					size="small"
				/>
			</div>

			{activeView === "analytics" ? <AnalyticsDashboard {...props} /> : <AdminDashboard />}
		</div>
	);
});
