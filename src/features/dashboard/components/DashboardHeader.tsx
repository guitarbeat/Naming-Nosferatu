import { Activity, BarChart3, Target, TrendingUp, Trophy, User, Users } from "lucide-react";
import { memo } from "react";
import type { SiteStats, UserStats } from "@/shared/api";
import { themeSurfaces } from "@/shared/lib/uiUtils";
import type { QuickStat } from "../types";
import { Panel, SectionHeader, StatTile } from "./Common";

export function getQuickStats({
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

export const DashboardHeader = memo(function DashboardHeader({
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
							<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
								Profile
							</span>
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
