/**
 * @module AnalyticsDashboard
 * @description Consolidated analytics components for Naming Nosferatu.
 * Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table, insights, and a bump chart.
 */

import { useCallback, useMemo, useState } from "react";
import type React from "react";
import { STORAGE_KEYS } from "../../core/constants";
import { useCollapsible } from "../../core/hooks/useStorage";
import { BumpChart } from "../../shared/components/Charts";
import {
  CollapsibleContent,
  CollapsibleHeader,
} from "../../shared/components/CollapsibleHeader";
import { useNameManagementContextOptional } from "../../shared/components/NameManagementView/nameManagementCore";
import { TournamentToolbar } from "../../shared/components/TournamentToolbar/TournamentToolbar";
import { PerformanceBadges } from "../../shared/components/PerformanceBadge";
import { hiddenNamesAPI } from "../../shared/services/supabase/client";
import {
  clearAllCaches,
  devError,
  formatDate,
  getMetricLabel,
  getRankDisplay,
} from "../../shared/utils";
import styles from "./analytics.module.css";
import { useAnalysisData } from "./useAnalysisData";
import { useAnalysisDisplayData } from "./useAnalysisDisplayData";
import type {
  AnalysisDashboardProps,
  AnalyticsDataItem,
  LeaderboardItem,
  ConsolidatedName,
  SummaryStats,
  NameWithInsight,
} from "./types";

/* =========================================================================
   SUB-COMPONENTS
   ========================================================================= */

/**
 * ColumnHeader Component for sortable tables
 */
const ColumnHeader: React.FC<{
  label: string;
  metricName?: string;
  sortable?: boolean;
  sorted?: boolean;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string, direction: "asc" | "desc") => void;
  className?: string;
}> = ({
  label,
  metricName,
  sortable = true,
  sorted = false,
  sortDirection = "desc",
  onSort,
  className = "",
}) => {
  const handleSort = () => {
    if (!sortable || !onSort || !metricName) {
      return;
    }
    const newDirection = sorted && sortDirection === "desc" ? "asc" : "desc";
    onSort(metricName, newDirection);
  };

  const headerClass = [
    styles.columnHeaderButton,
    sorted ? styles.sorted : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div className={styles.columnHeaderLabel}>
      <span className={styles.columnHeaderText}>{label}</span>
      {sortable && sorted && (
        <span className={styles.columnHeaderSortIndicator} aria-hidden="true">
          {sortDirection === "desc" ? "▼" : "▲"}
        </span>
      )}
      {metricName && (
        <span
          title={`Metric: ${metricName}`}
          style={{
            marginLeft: "4px",
            opacity: 0.7,
            fontSize: "0.8em",
            cursor: "help",
          }}
        >
          ⓘ
        </span>
      )}
    </div>
  );

  if (!sortable) {
    return (
      <div className={`${styles.columnHeader} ${className}`}>
        <div className={styles.columnHeaderLabel}>
          <span className={styles.columnHeaderText}>{label}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      className={headerClass}
      onClick={handleSort}
      aria-sort={
        sorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
      }
      type="button"
    >
      {content}
    </button>
  );
};

/**
 * AnalysisTable Component showing local/global leaderboard
 */
const AnalysisTable: React.FC<{
  names: ConsolidatedName[];
  isAdmin: boolean;
  canHideNames: boolean;
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
  onHideName: (id: string | number, name: string) => Promise<void>;
  summaryStats: SummaryStats | null;
}> = ({
  names,
  isAdmin,
  canHideNames,
  sortField,
  sortDirection,
  onSort,
  onHideName,
  summaryStats,
}) => {
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return (
      <span className={styles.sortIndicator}>
        {sortDirection === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  const handleSort = (field: string, _direction: "asc" | "desc") => {
    onSort(field);
  };

  return (
    <div className={styles.tableWrapper}>
      <table
        className={styles.table}
        role="table"
        aria-label="Top performing cat names ranked by rating, wins, and selection count"
      >
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Name</th>
            <th
              scope="col"
              className={`${styles.sortable} ${styles.sortableHeader}`}
              onClick={() => onSort("rating")}
            >
              {isAdmin ? (
                <ColumnHeader
                  label={getMetricLabel("rating")}
                  metricName="rating"
                  sortable={true}
                  sorted={sortField === "rating"}
                  sortDirection={sortDirection as "asc" | "desc"}
                  onSort={handleSort}
                />
              ) : (
                <>Rating {renderSortIndicator("rating")}</>
              )}
            </th>
            <th
              scope="col"
              className={`${styles.sortable} ${styles.sortableHeader}`}
              onClick={() => onSort("wins")}
            >
              {isAdmin ? (
                <ColumnHeader
                  label={getMetricLabel("total_wins")}
                  metricName="total_wins"
                  sortable={true}
                  sorted={sortField === "wins"}
                  sortDirection={sortDirection as "asc" | "desc"}
                  onSort={handleSort}
                />
              ) : (
                <>Wins {renderSortIndicator("wins")}</>
              )}
            </th>
            <th
              scope="col"
              className={`${styles.sortable} ${styles.sortableHeader}`}
              onClick={() => onSort("selected")}
            >
              {isAdmin ? (
                <ColumnHeader
                  label={getMetricLabel("times_selected")}
                  metricName="times_selected"
                  sortable={true}
                  sorted={sortField === "selected"}
                  sortDirection={sortDirection as "asc" | "desc"}
                  onSort={handleSort}
                />
              ) : (
                <>Selected {renderSortIndicator("selected")}</>
              )}
            </th>
            {isAdmin && (
              <th scope="col">
                <span className={styles.columnHeaderLabel}>Insights</span>
              </th>
            )}
            <th
              scope="col"
              className={`${styles.sortable} ${styles.sortableHeader}`}
              onClick={() => onSort("dateSubmitted")}
            >
              {isAdmin ? (
                <ColumnHeader
                  label={getMetricLabel("created_at")}
                  metricName="created_at"
                  sortable={true}
                  sorted={sortField === "dateSubmitted"}
                  sortDirection={sortDirection as "asc" | "desc"}
                  onSort={handleSort}
                />
              ) : (
                <>Date {renderSortIndicator("dateSubmitted")}</>
              )}
            </th>
            {canHideNames && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {names.map((item, index) => {
            const rank = index + 1;
            const ratingPercent =
              summaryStats && (summaryStats.maxRating ?? 0) > 0
                ? Math.min(
                    (item.rating / (summaryStats.maxRating ?? 1)) * 100,
                    100,
                  )
                : 0;
            const winsPercent =
              summaryStats && (summaryStats.maxWins ?? 0) > 0
                ? Math.min((item.wins / (summaryStats.maxWins ?? 1)) * 100, 100)
                : 0;
            const selectedPercent =
              summaryStats && (summaryStats.maxSelected ?? 0) > 0
                ? Math.min(
                    (item.selected / (summaryStats.maxSelected ?? 1)) * 100,
                    100,
                  )
                : 0;

            return (
              <tr key={item.id || index} className={styles.tableRow}>
                <td className={styles.colRank} scope="row">
                  <span className={`${styles.rankBadge} ${styles.top}`}>
                    {isAdmin ? getRankDisplay(rank) : rank}
                  </span>
                </td>
                <td className={styles.colName}>{item.name}</td>
                <td>
                  {isAdmin ? (
                    <div>
                      <span
                        aria-label={`Rating: ${item.rating} (${item.ratingPercentile}th percentile)`}
                      >
                        {item.rating}
                      </span>
                      <span className={styles.percentileLabel}>
                        {item.ratingPercentile}%ile
                      </span>
                    </div>
                  ) : (
                    <div className={styles.metricWithBar}>
                      <span
                        className={styles.metricValue}
                        aria-label={`Rating: ${item.rating}`}
                      >
                        {item.rating}
                      </span>
                      <div className={styles.metricBar}>
                        <div
                          className={`${styles.metricBarFill} ${styles.rating}`}
                          style={{ width: `${ratingPercent}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <span
                      className={styles.metricValue}
                      aria-label={`Wins: ${item.wins}`}
                    >
                      {item.wins}
                    </span>
                  ) : (
                    <div className={styles.metricWithBar}>
                      <span
                        className={styles.metricValue}
                        aria-label={`Wins: ${item.wins}`}
                      >
                        {item.wins}
                      </span>
                      <div className={styles.metricBar}>
                        <div
                          className={`${styles.metricBarFill} ${styles.wins}`}
                          style={{ width: `${winsPercent}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <div>
                      <span
                        className={styles.metricValue}
                        aria-label={`Selected ${item.selected} times (${item.selectedPercentile}th percentile)`}
                      >
                        {item.selected}
                      </span>
                      <span className={styles.percentileLabel}>
                        {item.selectedPercentile}%ile
                      </span>
                    </div>
                  ) : (
                    <div className={styles.metricWithBar}>
                      <span
                        className={styles.metricValue}
                        aria-label={`Selected ${item.selected} times`}
                      >
                        {item.selected}
                      </span>
                      <div className={styles.metricBar}>
                        <div
                          className={`${styles.metricBarFill} ${styles.selected}`}
                          style={{ width: `${selectedPercent}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <PerformanceBadges
                      types={
                        Array.isArray(item.insights)
                          ? (item.insights as string[])
                          : []
                      }
                    />
                  </td>
                )}
                <td>
                  {item.dateSubmitted ? (
                    <span
                      className={styles.metricValue}
                      aria-label={`Submitted: ${formatDate(item.dateSubmitted)}`}
                      title={formatDate(item.dateSubmitted, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    >
                      {formatDate(item.dateSubmitted, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span
                      className={styles.dateUnknown}
                      aria-label="Date unknown"
                    >
                      —
                    </span>
                  )}
                </td>
                {canHideNames && (
                  <td className={styles.colActions}>
                    <button
                      type="button"
                      className={styles.hideButton}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await onHideName(item.id, item.name);
                        } catch (error) {
                          devError(
                            "[AnalysisDashboard] Failed to hide name:",
                            error,
                          );
                        }
                      }}
                      aria-label={`Hide ${item.name}`}
                      title="Hide this name from tournaments"
                    >
                      <span aria-hidden="true">Hide</span>
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * AnalysisInsights Component showing data highlights
 */
const AnalysisInsights: React.FC<{
  namesWithInsights: NameWithInsight[];
  summaryStats: SummaryStats | null;
  generalInsights: Array<{ type: string; message: string; icon: string }>;
  isAdmin: boolean;
  canHideNames: boolean;
  onHideName: (id: string | number, name: string) => Promise<void>;
}> = ({
  namesWithInsights,
  summaryStats,
  generalInsights,
  isAdmin,
  canHideNames,
  onHideName,
}) => {
  const renderStatsSummary = () => {
    if (!summaryStats) {
      return null;
    }

    if (isAdmin) {
      return (
        <div className={styles.statsSummary}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Names</div>
            <div className={styles.statValue}>
              {summaryStats.totalNames || 0}
            </div>
            <div className={styles.statSubtext}>
              {summaryStats.activeNames || 0} active
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg Rating</div>
            <div className={styles.statValue}>{summaryStats.avgRating}</div>
            <div className={styles.statSubtext}>Global Average</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Votes</div>
            <div className={styles.statValue}>
              {summaryStats.totalRatings || 0}
            </div>
            <div className={styles.statSubtext}>
              {summaryStats.totalSelections || 0} selections
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.statsSummary}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Top Rating</div>
          <div className={styles.statValue}>{summaryStats.maxRating ?? 0}</div>
          <div className={styles.statName}>{summaryStats.topName?.name}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg Rating</div>
          <div className={styles.statValue}>{summaryStats.avgRating}</div>
          <div className={styles.statSubtext}>
            Across {namesWithInsights.length} names
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Selected</div>
          <div className={styles.statValue}>
            {summaryStats.totalSelected ?? 0}
          </div>
          <div className={styles.statSubtext}>
            {(summaryStats.maxSelected ?? 0) > 0
              ? `Most: ${summaryStats.maxSelected}x`
              : "No selections yet"}
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralInsights = () => {
    if (generalInsights.length === 0 || isAdmin) {
      return null;
    }
    return (
      <div className={styles.insights}>
        {generalInsights.map((insight, idx) => (
          <div
            key={idx}
            className={`${styles.insight} ${styles[insight.type] || styles.info}`}
          >
            <span className={styles.insightIcon} aria-hidden="true">
              {insight.icon}
            </span>
            <span className={styles.insightText}>{insight.message}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderActionableInsights = () => {
    const highPriorityTags = [
      "worst_rated",
      "never_selected",
      "inactive",
      "poor_performer",
    ];
    const lowPerformers = namesWithInsights.filter((n) =>
      n.insights.some((i: string) => highPriorityTags.includes(i)),
    );

    if (lowPerformers.length === 0) {
      return null;
    }

    return (
      <div className={styles.insightsSection}>
        <h3 className={styles.sectionTitle}>⚠️ Names to Consider Hiding</h3>
        <div className={styles.insightCards}>
          {lowPerformers
            .sort((a, b) => {
              const priority: Record<string, number> = {
                inactive: 0,
                never_selected: 1,
                worst_rated: 2,
                poor_performer: 3,
              };
              const getP = (item: NameWithInsight) =>
                Math.min(
                  ...item.insights
                    .filter((i: string) => highPriorityTags.includes(i))
                    .map((i: string) => priority[i] ?? 99),
                );
              const pA = getP(a);
              const pB = getP(b);
              if (pA !== pB) {
                return pA - pB;
              }
              return a.rating - b.rating;
            })
            .slice(0, 12)
            .map((n) => (
              <div
                key={n.id}
                className={`${styles.insightCard} ${styles.warning}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardName}>{n.name}</div>
                  {canHideNames && (
                    <button
                      type="button"
                      className={styles.cardHideBtn}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await onHideName(n.id, n.name);
                        } catch (error) {
                          devError(
                            "[AnalysisDashboard] Failed to hide name:",
                            error,
                          );
                        }
                      }}
                      aria-label={`Hide ${n.name}`}
                      title="Hide this name"
                    >
                      Hide
                    </button>
                  )}
                </div>
                <div className={styles.cardMetrics}>
                  <span>Rating {Math.round(n.rating)}</span>
                  <span>{n.selected} selected</span>
                  {n.wins > 0 && <span>{n.wins} wins</span>}
                </div>
                <div className={styles.cardTags}>
                  {n.insights
                    .filter((i: string) => highPriorityTags.includes(i))
                    .map((tag: string) => (
                      <span
                        key={tag}
                        className={`${styles.tag} ${styles.warning}`}
                      >
                        {tag.replace("_", " ")}
                      </span>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderPositiveInsights = () => {
    const positiveTags = [
      "top_rated",
      "most_selected",
      "underrated",
      "undefeated",
    ];
    const topPerformers = namesWithInsights.filter((n) =>
      n.insights.some((i: string) => positiveTags.includes(i)),
    );

    if (topPerformers.length === 0) {
      return null;
    }

    return (
      <div className={styles.insightsSection}>
        <h3 className={styles.sectionTitle}>✨ Top Performers (Keep)</h3>
        <div className={styles.insightCards}>
          {topPerformers.slice(0, 6).map((n) => (
            <div key={n.id} className={styles.insightCard}>
              <div className={styles.cardName}>{n.name}</div>
              <div className={styles.cardMetrics}>
                <span>Rating {Math.round(n.rating)}</span>
                <span>{n.selected} selected</span>
              </div>
              <div className={styles.cardTags}>
                {n.insights
                  .filter((i: string) => positiveTags.includes(i))
                  .map((tag: string) => (
                    <span key={tag} className={styles.tag}>
                      {tag.replace("_", " ")}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.insightsPanel}>
      {renderStatsSummary()}
      {renderGeneralInsights()}
      {renderActionableInsights()}
      {renderPositiveInsights()}
    </div>
  );
};

/**
 * AnalysisPanel Wrapper Component
 */
const AnalysisPanel: React.FC<{
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  showHeader?: boolean;
  toolbar?: React.ReactNode;
  className?: string;
}> = ({
  children,
  title,
  actions,
  showHeader = true,
  toolbar,
  className = "",
}) => {
  return (
    <div className={`${styles.insightsPanel} ${className}`}>
      {showHeader && (
        <CollapsibleHeader
          title={title || ""}
          actions={actions}
          variant="compact"
        />
      )}
      {toolbar && <div className={styles.viewToggle}>{toolbar}</div>}
      {children}
    </div>
  );
};

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */

export function AnalysisDashboard({
  highlights,
  userName,
  showGlobalLeaderboard = true,
  defaultCollapsed = false,
  isAdmin = false,
  onNameHidden,
}: AnalysisDashboardProps) {
  const [viewMode, setViewMode] = useState("chart"); // "chart" | "table" | "insights"
  const [sortField, setSortField] = useState("rating");
  const [sortDirection, setSortDirection] = useState("desc");

  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    STORAGE_KEYS.ANALYSIS_DASHBOARD_COLLAPSED,
    defaultCollapsed,
  );

  // Get context for filtering (with fallback for standalone usage)
  const toolbarContext = useNameManagementContextOptional();
  const filterConfig = toolbarContext?.filterConfig;
  const userFilter = filterConfig?.userFilter || "all";
  const dateFilter = filterConfig?.dateFilter || "all";

  const rankingPeriods = useMemo(() => {
    const map: Record<string, number> = {
      today: 2,
      week: 7,
      month: 30,
      year: 365,
      all: 7,
    };
    return Math.max(map[dateFilter] || 7, 2);
  }, [dateFilter]);

  // 1. Fetch Data
  const {
    leaderboardData,
    selectionPopularity,
    analyticsData,
    rankingHistory,
    siteStats,
    isLoading,
    error,
    refetch,
  } = useAnalysisData({
    userName,
    isAdmin,
    userFilter,
    dateFilter,
    rankingPeriods,
    enabled: showGlobalLeaderboard,
  });

  // 2. Process Data
  const { displayNames, summaryStats, namesWithInsights, generalInsights } =
    useAnalysisDisplayData({
      leaderboardData: (leaderboardData ?? null) as LeaderboardItem[] | null,
      selectionPopularity: selectionPopularity ?? null,
      analyticsData: (analyticsData ?? null) as AnalyticsDataItem[] | null,
      isAdmin,
      highlights,
      filterConfig: filterConfig as {
        selectionFilter?: string;
        dateFilter?: string;
        [key: string]: unknown;
      },
      sortField,
      sortDirection,
    });

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField],
  );

  const handleHideName = useCallback(
    async (nameId: string | number, _name: string) => {
      if (!isAdmin || !userName) {
        return;
      }
      try {
        await hiddenNamesAPI.hideName(userName, String(nameId));
        clearAllCaches();
        if (onNameHidden) {
          onNameHidden(String(nameId));
        }
        refetch();
      } catch (error) {
        devError("[AnalysisDashboard] Error hiding name:", error);
      }
    },
    [isAdmin, userName, onNameHidden, refetch],
  );

  const filteredRankingData = useMemo(() => {
    if (!rankingHistory?.data?.length) {
      return [];
    }
    const allowedIds = new Set(displayNames.map((n) => n.id));
    const filtered =
      allowedIds.size === 0
        ? rankingHistory.data
        : rankingHistory.data.filter((entry) => allowedIds.has(entry.id));

    // Filter out null values from rankings to match BumpChart expectations
    return filtered.map((entry) => ({
      ...entry,
      rankings: entry.rankings.filter(
        (ranking): ranking is number => ranking != null,
      ),
    }));
  }, [rankingHistory?.data, displayNames]);

  if (!showGlobalLeaderboard && !highlights) {
    return null;
  }

  const toolbar = toolbarContext?.analysisMode ? (
    <TournamentToolbar
      mode="hybrid"
      filters={toolbarContext.filterConfig}
      onFilterChange={
        (toolbarContext.handleFilterChange as (
          name: string,
          value: string,
        ) => void) ||
        ((name: string, value: string) => {
          if (name === "searchTerm" && toolbarContext?.setSearchQuery) {
            toolbarContext.setSearchQuery(value);
          }
          if (name === "category" && toolbarContext?.setSelectedCategory) {
            toolbarContext.setSelectedCategory(value || "");
          }
          if (name === "sortBy" && toolbarContext?.setSortBy) {
            toolbarContext.setSortBy(value || "alphabetical");
          }
          if (name === "filterStatus" && toolbarContext?.setFilterStatus) {
            toolbarContext.setFilterStatus(value);
          }
          if (name === "userFilter" && toolbarContext?.setUserFilter) {
            toolbarContext.setUserFilter(value as "all" | "user" | "other");
          }
          if (
            name === "selectionFilter" &&
            toolbarContext?.setSelectionFilter
          ) {
            toolbarContext.setSelectionFilter(
              value as "all" | "selected" | "unselected",
            );
          }
          if (name === "dateFilter" && toolbarContext?.setDateFilter) {
            toolbarContext.setDateFilter(
              value as "all" | "today" | "week" | "month",
            );
          }
          if (name === "sortOrder" && toolbarContext?.setSortOrder) {
            toolbarContext.setSortOrder(value as "asc" | "desc");
          }
        })
      }
      categories={toolbarContext.categories || []}
      showUserFilter={toolbarContext.profileProps?.showUserFilter || false}
      showSelectionFilter={!!toolbarContext.profileProps?.selectionStats}
      userOptions={toolbarContext.profileProps?.userOptions || []}
      filteredCount={displayNames.length}
      totalCount={displayNames.length} // Simplified for now
      analysisMode={true}
    />
  ) : null;

  return (
    <AnalysisPanel showHeader={false}>
      <CollapsibleHeader
        title={isAdmin ? "All Names" : "Top Names"}
        icon={isAdmin ? "📈" : "📊"}
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        contentId="analysis-dashboard-content"
        toolbar={toolbar}
      />

      <CollapsibleContent
        id="analysis-dashboard-content"
        isCollapsed={isCollapsed}
      >
        {isLoading ? (
          <div className={styles.analysisPanel} role="status">
            Loading top names...
          </div>
        ) : error ? (
          <div className={styles.analysisPanel} role="alert">
            Unable to load names. Please try refreshing the page.
          </div>
        ) : displayNames.length === 0 ? (
          <div className={styles.analysisPanel}>
            No names available yet. Start a tournament to see results here!
          </div>
        ) : (
          <>
            <div className={styles.viewToggle}>
              {["chart", "table", "insights"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.viewBtn} ${viewMode === mode ? styles.active : ""}`}
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                >
                  {mode === "chart"
                    ? "📊 Bump Chart"
                    : mode === "table"
                      ? "📋 Table"
                      : "💡 Insights"}
                </button>
              ))}
            </div>

            {viewMode === "chart" && rankingHistory && (
              <div className={styles.chartContainer}>
                <BumpChart
                  data={filteredRankingData}
                  labels={rankingHistory.timeLabels}
                  timeLabels={rankingHistory.timeLabels}
                  title=""
                  height={320}
                  showLegend={true}
                />
              </div>
            )}

            {viewMode === "table" && (
              <AnalysisTable
                names={namesWithInsights}
                isAdmin={isAdmin}
                canHideNames={isAdmin && !!onNameHidden}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onHideName={handleHideName}
                summaryStats={summaryStats}
              />
            )}

            {viewMode === "insights" && (
              <AnalysisInsights
                namesWithInsights={namesWithInsights}
                summaryStats={isAdmin ? (siteStats ?? null) : summaryStats}
                generalInsights={generalInsights}
                isAdmin={isAdmin}
                canHideNames={isAdmin && !!onNameHidden}
                onHideName={handleHideName}
              />
            )}
          </>
        )}
      </CollapsibleContent>
    </AnalysisPanel>
  );
}
