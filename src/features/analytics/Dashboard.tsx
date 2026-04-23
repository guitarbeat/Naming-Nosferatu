import type { ElementType } from "react";
import Button from "@/shared/components/layout/Button";
import { EmptyState } from "@/shared/components/layout/EmptyState";
import { Loading } from "@/shared/components/layout/Feedback";
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
} from "@/shared/lib/icons";
import type { SiteStats, UserStats } from "@/shared/services/supabase/statsService";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel, SectionHeader, StatTile } from "./components/DashboardPrimitives";
import { RatingDistributionChart } from "./components/RatingDistributionChart";
import { RatingRadarChart } from "./components/RatingRadarChart";
import { TopNamesChart } from "./components/TopNamesChart";
import { WinLossChart } from "./components/WinLossChart";
import { type DashboardTimeframe, useDashboardData } from "./hooks/useDashboardData";
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
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">
                                                Your completed bracket creates a saved order you can adjust and revisit.
                                        </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
                                                Community Layer
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">
                                                Leaderboard and site stats summarize shared activity across everyone using the app.
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
        const quickStats = getQuickStats({ siteStats, userName, userStats });
        const hasPersonalRatings = Boolean(personalRatings && Object.keys(personalRatings).length > 0);
        const hasCommunityData = leaderboard.length > 0 || Boolean(siteStats);
        const shouldShowDashboardPrimer =
                !hasPersonalRatings && !isLoadingLeaderboard && !hasCommunityData;

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
                                                                        <h2 className="mt-2 truncate text-2xl font-semibold text-foreground">
                                                                                {userName}
                                                                        </h2>
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
                                <Panel>
                                        <SectionHeader
                                                icon={Trophy}
                                                title="Leaderboard"
                                                subtitle="Top of the pool."
                                                action={
                                                        <div className="flex items-center gap-2">
                                                                <ContextBadge label="Community" />
                                                                {onStartNew ? (
                                                                        <Button variant="outline" size="small" onClick={onStartNew}>
                                                                                New Tournament
                                                                        </Button>
                                                                ) : undefined}
                                                        </div>
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
                                                                                        {entry.total_ratings} rating
                                                                                        {entry.total_ratings !== 1 ? "s" : ""} | {entry.wins} win
                                                                                        {entry.wins !== 1 ? "s" : ""}
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
                                                <EmptyState
                                                        variant="box"
                                                        title="No community ratings yet."
                                                        description="Complete a few tournament sessions to start separating the personal bracket layer from the shared leaderboard."
                                                />
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

                                        {siteStats && (
                                                <Panel>
                                                        <SectionHeader
                                                                icon={Users}
                                                                title="Site Statistics"
                                                                subtitle="Pool totals."
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
                                                <StatTile
                                                        label="Matches played"
                                                        value={engagementMetrics.totalMatches}
                                                        icon={Trophy}
                                                />
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
                        )}
                </div>
        );
}
