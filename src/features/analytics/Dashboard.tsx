import type { ReactNode } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import { Activity, Eye, EyeOff, Trophy } from "@/shared/lib/icons";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel } from "./components/DashboardPrimitives";
import { type DashboardTimeframe, useDashboardData } from "./hooks/useDashboardData";
import { PersonalResults } from "./PersonalResults";
import { WordCloudChart } from "./components/WordCloudChart";

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

function PanelTitle({ title, action }: { title: string; action?: ReactNode }) {
        return (
                <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="text-sm font-medium text-foreground/50">{title}</h3>
                        {action}
                </div>
        );
}

export function Dashboard({
        userName = "",
        isAdmin = false,
        isLoggedIn = false,
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
                timeframe,
                toggleHiddenNames,
        } = useDashboardData({ isAdmin, userName });

        const hasPersonalRatings = Boolean(personalRatings && Object.keys(personalRatings).length > 0);
        const hasCommunityData = leaderboard.length > 0;
        const shouldShowEmptyState = !hasPersonalRatings && !isLoadingLeaderboard && !hasCommunityData;

        return (
                <div className="w-full space-y-6">
                        {/* Empty state */}
                        {shouldShowEmptyState && (
                                <Panel className="border-dashed bg-black/10">
                                        <PanelTitle title="Nothing ranked yet" />
                                        <p className="text-sm text-muted-foreground/55">
                                                {isLoggedIn ? "Run a bracket to start." : "Run a bracket to begin."}
                                        </p>
                                </Panel>
                        )}

                        {/* Personal rankings */}
                        {hasPersonalRatings && onUpdateRatings && (
                                <Panel>
                                        <PanelTitle
                                                title="Your Rankings"
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

                        {/* Leaderboard */}
                        <Panel>
                                <PanelTitle
                                        title="Leaderboard"
                                        action={
                                                <div className="flex items-center gap-2">
                                                        <ContextBadge label="Community" />
                                                        {onStartNew && (
                                                                <Button variant="outline" size="small" onClick={onStartNew}>
                                                                        New Tournament
                                                                </Button>
                                                        )}
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
                                                                                {entry.total_ratings} rating{entry.total_ratings !== 1 ? "s" : ""} · {entry.wins} win{entry.wins !== 1 ? "s" : ""}
                                                                        </p>
                                                                </div>
                                                                <p className="text-lg font-semibold text-primary">
                                                                        {Math.round(entry.avg_rating)}
                                                                </p>
                                                        </div>
                                                ))}
                                        </div>
                                ) : (
                                        <p className="py-6 text-sm text-muted-foreground/55">
                                                No community ratings yet.
                                        </p>
                                )}
                        </Panel>

                        {/* Word cloud */}
                        {leaderboard.length > 0 && (
                                <Panel>
                                        <PanelTitle title="Word Cloud" />
                                        <WordCloudChart leaderboard={leaderboard} />
                                </Panel>
                        )}

                        {/* Engagement — admin only */}
                        {engagementMetrics && (
                                <Panel>
                                        <PanelTitle
                                                title="Recent Activity"
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
                                        <div className="flex gap-6 text-sm">
                                                <div>
                                                        <p className="text-2xl font-semibold text-primary">{engagementMetrics.peakActiveUsers}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground/60">Active raters</p>
                                                </div>
                                                <div>
                                                        <p className="text-2xl font-semibold text-foreground/80">{engagementMetrics.totalMatches}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground/60">Matches played</p>
                                                </div>
                                        </div>
                                </Panel>
                        )}

                        {/* Hidden names — admin only */}
                        {isAdmin && (
                                <Panel>
                                        <PanelTitle
                                                title="Hidden Names"
                                                action={
                                                        <Button variant="outline" size="small" onClick={toggleHiddenNames}>
                                                                {showHiddenNames ? "Hide" : "Show"}
                                                        </Button>
                                                }
                                        />
                                        {showHiddenNames && (
                                                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                                                        {hiddenNames.length > 0 ? (
                                                                hiddenNames.map((name, index) => (
                                                                        <div
                                                                                key={name.id}
                                                                                className={`flex items-center gap-3 px-4 py-3 ${
                                                                                        index < hiddenNames.length - 1 ? "border-b border-white/10" : ""
                                                                                }`}
                                                                        >
                                                                                <div className="min-w-0 flex-1">
                                                                                        <p className="truncate text-sm font-semibold text-foreground">{name.name}</p>
                                                                                        {name.description && (
                                                                                                <p className="truncate text-xs text-muted-foreground/70">{name.description}</p>
                                                                                        )}
                                                                                </div>
                                                                                <Button variant="ghost" size="small" onClick={() => handleUnhideName(name.id)}>
                                                                                        <Eye size={13} />
                                                                                        Unhide
                                                                                </Button>
                                                                        </div>
                                                                ))
                                                        ) : (
                                                                <p className="px-4 py-6 text-center text-sm text-muted-foreground/60">No hidden names.</p>
                                                        )}
                                                </div>
                                        )}
                                </Panel>
                        )}
                </div>
        );
}
