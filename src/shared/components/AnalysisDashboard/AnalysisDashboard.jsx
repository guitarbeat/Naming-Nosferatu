/**
 * @module AnalysisDashboard
 * @description Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table with Rating, Wins, and Selected counts.
 * Includes a bump chart visualization showing ranking changes over time.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { AnalysisPanel } from "../AnalysisPanel";
import { CollapsibleHeader, CollapsibleContent } from "../CollapsibleHeader";
import { TournamentToolbar } from "../TournamentToolbar/TournamentToolbar";
import { BumpChart } from "../BumpChart";
import { PerformanceBadges } from "../PerformanceBadge";
import { ColumnHeader } from "../ColumnHeader";
import { catNamesAPI, hiddenNamesAPI } from "../../services/supabase/api";
import { useCollapsible } from "../../hooks/useCollapsible";
import { useNameManagementContextSafe } from "../NameManagementView/NameManagementView";
import { STORAGE_KEYS } from "../../../core/constants";
import { devError } from "../../utils/logger";
import { clearAllCaches } from "../../utils/cacheUtils";
import { nameItemShape } from "../../propTypes";
import { getRankDisplay } from "../../utils/displayUtils";
import { formatDate } from "../../utils/timeUtils";
import { calculatePercentile } from "../../utils/metricsUtils";
import { getMetricLabel } from "../../utils/metricDefinitions";
import "./AnalysisDashboard.css";

/**
 * Analysis Dashboard Component
 * Shows top performing names to help users choose a name for their cat
 *
 * @param {Object} props
 * @param {Object} props.highlights - Highlight groups (topRated, mostWins)
 * @param {string} props.userName - Current user (unused, kept for compatibility)
 * @param {boolean} props.showGlobalLeaderboard - Whether to fetch global top names
 * @param {boolean} props.defaultCollapsed - Default collapsed state
 */
export function AnalysisDashboard({
  highlights,
  userName,
  showGlobalLeaderboard = true,
  defaultCollapsed = false,
  isAdmin = false,
  onNameHidden,
}) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectionPopularity, setSelectionPopularity] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null); // * Admin: full analytics
  const [rankingHistory, setRankingHistory] = useState({
    data: [],
    timeLabels: [],
  });
  const [viewMode, setViewMode] = useState("chart"); // "chart" | "table" | "insights"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("rating"); // * Add sorting for admin
  const [sortDirection, setSortDirection] = useState("desc");
  const canHideNames = isAdmin && typeof onNameHidden === "function";

  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    STORAGE_KEYS.ANALYSIS_DASHBOARD_COLLAPSED,
    defaultCollapsed,
  );

  // * Get context for filtering (optional - only if available)
  const toolbarContext = useNameManagementContextSafe();
  const userFilter = toolbarContext?.filterConfig?.userFilter || "all";
  const dateFilter = toolbarContext?.filterConfig?.dateFilter || "all";

  // * Map date filter to period count for ranking history
  const rankingPeriods = useMemo(() => {
    const map = {
      today: 2,
      week: 7,
      month: 30,
      year: 365,
      all: 7,
    };
    return Math.max(map[dateFilter] || 7, 2);
  }, [dateFilter]);

  // Fetch global leaderboard and selection popularity data on mount and when filters change
  useEffect(() => {
    if (!showGlobalLeaderboard) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const historyPromise = catNamesAPI.getRankingHistory(
          10,
          rankingPeriods,
          {
            dateFilter,
          },
        );
        if (isAdmin) {
          const [analytics, leaderboard, popularity, history] =
            await Promise.all([
              catNamesAPI.getPopularityAnalytics(null, userFilter, userName),
              catNamesAPI.getLeaderboard(null),
              catNamesAPI.getSelectionPopularity(null),
              historyPromise,
            ]);
          setAnalyticsData(analytics);
          setLeaderboardData(leaderboard);
          setSelectionPopularity(popularity);
          setRankingHistory(history);
        } else {
          const [leaderboard, popularity, history] = await Promise.all([
            catNamesAPI.getLeaderboard(null),
            catNamesAPI.getSelectionPopularity(null),
            historyPromise,
          ]);
          setLeaderboardData(leaderboard);
          setSelectionPopularity(popularity);
          setRankingHistory(history);
        }
      } catch (err) {
        devError("Failed to fetch analytics:", err);
        setError("Failed to load top names. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    showGlobalLeaderboard,
    isAdmin,
    userFilter,
    userName,
    rankingPeriods,
    dateFilter,
  ]);

  const consolidatedNames = useMemo(() => {
    if (isAdmin && analyticsData?.length) {
      return analyticsData.map((item) => ({
        id: item.name_id,
        name: item.name,
        rating: item.avg_rating || 1500,
        wins: item.total_wins || 0,
        selected: item.times_selected || 0,
        dateSubmitted: item.created_at || item.date_submitted || null,
      }));
    }

    const nameMap = new Map();

    if (leaderboardData?.length) {
      leaderboardData.forEach((item) => {
        if (item.avg_rating > 1500 || item.wins > 0) {
          nameMap.set(item.name_id, {
            id: item.name_id,
            name: item.name,
            rating: item.avg_rating || 1500,
            wins: item.wins || 0,
            selected: 0,
            dateSubmitted: item.created_at || item.date_submitted || null,
          });
        }
      });
    }

    if (selectionPopularity?.length) {
      selectionPopularity.forEach((item) => {
        const existing = nameMap.get(item.name_id);
        if (existing) {
          existing.selected = item.times_selected || 0;
        } else {
          nameMap.set(item.name_id, {
            id: item.name_id,
            name: item.name,
            rating: 1500,
            wins: 0,
            selected: item.times_selected || 0,
            dateSubmitted: item.created_at || item.date_submitted || null,
          });
        }
      });
    }

    return Array.from(nameMap.values()).sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.wins - a.wins;
    });
  }, [leaderboardData, selectionPopularity, analyticsData, isAdmin]);

  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField],
  );

  const renderSortIndicator = useCallback(
    (field) => {
      if (sortField !== field) return null;
      return (
        <span className="sort-indicator">
          {sortDirection === "desc" ? "↓" : "↑"}
        </span>
      );
    },
    [sortField, sortDirection],
  );

  const handleHideName = useCallback(
    async (nameId, _name) => {
      if (!isAdmin || !userName) {
        devError("[AnalysisDashboard] Cannot hide: not admin or no userName");
        return;
      }

      try {
        if (analyticsData) {
          setAnalyticsData((prev) =>
            prev ? prev.filter((item) => item.name_id !== nameId) : prev,
          );
        }
        if (leaderboardData) {
          setLeaderboardData((prev) =>
            prev ? prev.filter((item) => item.name_id !== nameId) : prev,
          );
        }
        if (selectionPopularity) {
          setSelectionPopularity((prev) =>
            prev ? prev.filter((item) => item.name_id !== nameId) : prev,
          );
        }

        await hiddenNamesAPI.hideName(userName, nameId);

        // * Clear caches to ensure hidden names don't appear in tournaments
        clearAllCaches();

        if (onNameHidden) {
          onNameHidden(nameId);
        }

        setTimeout(async () => {
          try {
            if (isAdmin) {
              const analytics = await catNamesAPI.getPopularityAnalytics(
                50,
                userFilter,
                userName,
              );
              setAnalyticsData(analytics);
            } else {
              const [leaderboard, popularity] = await Promise.all([
                catNamesAPI.getLeaderboard(10),
                catNamesAPI.getSelectionPopularity(10),
              ]);
              setLeaderboardData(leaderboard);
              setSelectionPopularity(popularity);
            }
          } catch (err) {
            devError("Failed to refresh after hide:", err);
          }
        }, 500);
      } catch (error) {
        devError("[AnalysisDashboard] Error hiding name:", error);
        if (isAdmin) {
          const analytics = await catNamesAPI.getPopularityAnalytics(
            50,
            userFilter,
            userName,
          );
          setAnalyticsData(analytics);
        } else {
          const [leaderboard, popularity] = await Promise.all([
            catNamesAPI.getLeaderboard(10),
            catNamesAPI.getSelectionPopularity(10),
          ]);
          setLeaderboardData(leaderboard);
          setSelectionPopularity(popularity);
        }
      }
    },
    [
      isAdmin,
      userName,
      onNameHidden,
      analyticsData,
      leaderboardData,
      selectionPopularity,
      userFilter,
    ],
  );

  const displayNames = useMemo(() => {
    const filters = toolbarContext?.filterConfig || {};
    let names = [];

    if (isAdmin && consolidatedNames.length > 0) {
      names = [...consolidatedNames];
    } else if (highlights?.topRated?.length) {
      const highlightMap = new Map();
      highlights.topRated.forEach((item) => {
        highlightMap.set(item.id, {
          id: item.id,
          name: item.name,
          rating: item.avg_rating || item.value || 1500,
          wins: 0,
          selected: 0,
        });
      });
      if (highlights.mostWins?.length) {
        highlights.mostWins.forEach((item) => {
          const existing = highlightMap.get(item.id);
          if (existing) {
            existing.wins = item.value || 0;
          }
        });
      }
      names = Array.from(highlightMap.values());
    } else {
      names = consolidatedNames;
    }

    // * Apply filters from TournamentToolbar
    if (toolbarContext && filters) {
      // * User filter is now applied at the API level in getPopularityAnalytics
      // * No need to filter here as data is already filtered by user

      // Selection filter
      if (filters.selectionFilter && filters.selectionFilter !== "all") {
        if (filters.selectionFilter === "selected") {
          names = names.filter((n) => n.selected > 0);
        } else if (filters.selectionFilter === "never_selected") {
          names = names.filter((n) => n.selected === 0);
        }
      }

      // Date filter (if dateSubmitted exists)
      if (filters.dateFilter && filters.dateFilter !== "all") {
        const now = new Date();
        let filterDate = new Date(0); // Start of epoch

        switch (filters.dateFilter) {
          case "today":
            filterDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            break;
          case "week":
            filterDate = new Date(now);
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "year":
            filterDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        names = names.filter((n) => {
          if (!n.dateSubmitted) return false;
          const submittedDate = new Date(n.dateSubmitted);
          return submittedDate >= filterDate;
        });
      }
    }

    // * Apply sorting (available for all users)
    if (sortField) {
      names.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle date sorting
        if (sortField === "dateSubmitted") {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }

        // Handle string sorting
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "desc"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }

        // Handle number sorting
        aVal = aVal ?? 0;
        bVal = bVal ?? 0;
        return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
      });
    } else {
      // Default sort by rating descending
      names.sort((a, b) => b.rating - a.rating);
    }

    return names;
  }, [
    highlights,
    consolidatedNames,
    isAdmin,
    sortField,
    sortDirection,
    toolbarContext,
  ]);

  const summaryStats = useMemo(() => {
    if (displayNames.length === 0) return null;

    const maxRating = Math.max(...displayNames.map((n) => n.rating));
    const maxWins = Math.max(...displayNames.map((n) => n.wins));
    const maxSelected = Math.max(...displayNames.map((n) => n.selected));
    const avgRating =
      displayNames.reduce((sum, n) => sum + n.rating, 0) / displayNames.length;
    const avgWins =
      displayNames.reduce((sum, n) => sum + n.wins, 0) / displayNames.length;
    const totalSelected = displayNames.reduce((sum, n) => sum + n.selected, 0);

    return {
      maxRating,
      maxWins,
      maxSelected,
      avgRating: Math.round(avgRating),
      avgWins: Math.round(avgWins * 10) / 10,
      totalSelected,
      topName: displayNames[0],
    };
  }, [displayNames]);

  // * Calculate percentiles and insights for each name
  const namesWithInsights = useMemo(() => {
    if (displayNames.length === 0) return [];

    return displayNames.map((item) => {
      const ratingPercentile = calculatePercentile(
        item.rating,
        displayNames.map((n) => n.rating),
        true,
      );
      const selectedPercentile = calculatePercentile(
        item.selected,
        displayNames.map((n) => n.selected),
        true,
      );

      // Determine insights/badges - focus on worst performers for removal
      const insights = [];
      // * Worst performers (for removal/hiding)
      if (ratingPercentile <= 10) insights.push("worst_rated");
      if (selectedPercentile <= 10 && item.selected === 0)
        insights.push("never_selected");
      if (item.selected === 0 && item.wins === 0 && item.rating <= 1500)
        insights.push("inactive");
      if (ratingPercentile <= 20 && selectedPercentile <= 20)
        insights.push("poor_performer");
      // * Good performers (keep for reference)
      if (ratingPercentile >= 90) insights.push("top_rated");
      if (selectedPercentile >= 90) insights.push("most_selected");
      if (ratingPercentile >= 70 && selectedPercentile < 50)
        insights.push("underrated");
      if (
        item.wins > 0 &&
        !displayNames.find((n) => n.id !== item.id && n.wins > 0)
      )
        insights.push("undefeated");

      return {
        ...item,
        ratingPercentile,
        selectedPercentile,
        insights,
      };
    });
  }, [displayNames]);

  const insights = useMemo(() => {
    if (!summaryStats || displayNames.length === 0) return [];

    const result = [];

    // * Focus on worst performers for removal/hiding
    const [worstRated] = displayNames
      .filter((n) => n.rating < 1500)
      .sort((a, b) => a.rating - b.rating);
    if (worstRated) {
      result.push({
        type: "warning",
        message: `${worstRated.name} has the lowest rating (${worstRated.rating}) - consider hiding`,
        icon: "⚠️",
      });
    }

    const neverSelected = displayNames.filter((n) => n.selected === 0);
    if (neverSelected.length > 0) {
      const [oldestNeverSelected] = neverSelected
        .filter((n) => n.dateSubmitted)
        .sort(
          (a, b) =>
            new Date(a.dateSubmitted).getTime() -
            new Date(b.dateSubmitted).getTime(),
        );
      if (oldestNeverSelected) {
        result.push({
          type: "warning",
          message: `${neverSelected.length} name${neverSelected.length > 1 ? "s" : ""} never selected. ${oldestNeverSelected.name} is oldest - consider removing`,
          icon: "🗑️",
        });
      } else if (neverSelected.length > 0) {
        result.push({
          type: "warning",
          message: `${neverSelected.length} name${neverSelected.length > 1 ? "s" : ""} never selected - consider hiding inactive ones`,
          icon: "🗑️",
        });
      }
    }

    const lowPerformers = displayNames.filter(
      (n) => n.rating <= 1500 && n.selected === 0 && n.wins === 0,
    );
    if (lowPerformers.length > 0) {
      result.push({
        type: "warning",
        message: `${lowPerformers.length} inactive name${lowPerformers.length > 1 ? "s" : ""} (no rating, no selections, no wins) - safe to hide`,
        icon: "🚫",
      });
    }

    // * Keep some positive insights for context
    if (summaryStats.topName) {
      result.push({
        type: "info",
        message: `${summaryStats.topName.name} leads with a rating of ${summaryStats.topName.rating}`,
        icon: "🏆",
      });
    }

    return result;
  }, [summaryStats, displayNames]);

  const filteredRankingData = useMemo(() => {
    if (!rankingHistory?.data?.length) return [];
    const allowedIds = new Set(displayNames.map((n) => n.id));
    if (allowedIds.size === 0) return rankingHistory.data;
    return rankingHistory.data.filter((entry) => allowedIds.has(entry.id));
  }, [rankingHistory.data, displayNames]);

  // * Get context for toolbar integration (optional - only if available)
  // * Safe hook returns null if context is not available
  // * Note: toolbarContext is now used above in displayNames useMemo

  // * Build toolbar if context is available and in analysis mode
  const toolbar =
    toolbarContext && toolbarContext.analysisMode ? (
      <TournamentToolbar
        mode="hybrid"
        filters={toolbarContext.filterConfig}
        onFilterChange={
          toolbarContext.handleFilterChange ||
          ((newFilters) => {
            // * Update context filters
            if (newFilters.searchTerm !== undefined) {
              toolbarContext.setSearchTerm(newFilters.searchTerm || "");
            }
            if (newFilters.category !== undefined) {
              toolbarContext.setSelectedCategory(newFilters.category || null);
            }
            if (newFilters.sortBy !== undefined) {
              toolbarContext.setSortBy(newFilters.sortBy || "alphabetical");
            }
            if (newFilters.filterStatus !== undefined) {
              toolbarContext.setFilterStatus(newFilters.filterStatus);
            }
            if (newFilters.userFilter !== undefined) {
              toolbarContext.setUserFilter(newFilters.userFilter);
            }
            if (newFilters.selectionFilter !== undefined) {
              toolbarContext.setSelectionFilter(newFilters.selectionFilter);
            }
            if (newFilters.dateFilter !== undefined) {
              toolbarContext.setDateFilter(newFilters.dateFilter);
            }
            if (newFilters.sortOrder !== undefined) {
              toolbarContext.setSortOrder(newFilters.sortOrder);
            }
          })
        }
        categories={toolbarContext.categories || []}
        showUserFilter={toolbarContext.profileProps?.showUserFilter || false}
        showSelectionFilter={!!toolbarContext.profileProps?.selectionStats}
        userOptions={toolbarContext.profileProps?.userOptions || []}
        filteredCount={displayNames.length}
        totalCount={consolidatedNames.length}
        selectedCount={toolbarContext.selectedCount || 0}
        showSelectedOnly={toolbarContext.showSelectedOnly || false}
        onToggleShowSelected={toolbarContext.setShowSelectedOnly}
        isSwipeMode={toolbarContext.isSwipeMode || false}
        onToggleSwipeMode={toolbarContext.setIsSwipeMode}
        showCatPictures={toolbarContext.showCatPictures || false}
        onToggleCatPictures={toolbarContext.setShowCatPictures}
        analysisMode={true}
      />
    ) : null;

  // Don't render if no data and not loading/error
  const hasData = displayNames.length > 0 || isLoading || error;

  if (!hasData) {
    return null;
  }

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
          <div className="analysis-loading" role="status" aria-live="polite">
            Loading top names...
          </div>
        ) : error ? (
          <div className="analysis-error" role="alert">
            {error}
          </div>
        ) : displayNames.length === 0 ? (
          <div className="analysis-empty" role="status">
            No names available yet.
          </div>
        ) : (
          <>
            {/* View Toggle */}
            <div className="analysis-view-toggle">
              <button
                type="button"
                className={`analysis-view-btn ${viewMode === "chart" ? "active" : ""}`}
                onClick={() => setViewMode("chart")}
                aria-pressed={viewMode === "chart"}
              >
                📊 Bump Chart
              </button>
              <button
                type="button"
                className={`analysis-view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
              >
                📋 Table
              </button>
              <button
                type="button"
                className={`analysis-view-btn ${viewMode === "insights" ? "active" : ""}`}
                onClick={() => setViewMode("insights")}
                aria-pressed={viewMode === "insights"}
              >
                💡 Insights
              </button>
            </div>

            {/* Bump Chart View */}
            {viewMode === "chart" && (
              <div className="analysis-chart-container">
                <BumpChart
                  data={filteredRankingData}
                  timeLabels={rankingHistory.timeLabels}
                  maxDisplayed={displayNames.length}
                  height={320}
                  showLegend={true}
                />
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <>
                {summaryStats && !isAdmin && (
                  <div className="analysis-stats-summary">
                    <div className="analysis-stat-card">
                      <div className="analysis-stat-label">Top Rating</div>
                      <div className="analysis-stat-value">
                        {summaryStats.maxRating}
                      </div>
                      <div className="analysis-stat-name">
                        {summaryStats.topName?.name}
                      </div>
                    </div>
                    <div className="analysis-stat-card">
                      <div className="analysis-stat-label">Avg Rating</div>
                      <div className="analysis-stat-value">
                        {summaryStats.avgRating}
                      </div>
                      <div className="analysis-stat-subtext">
                        Across {displayNames.length} names
                      </div>
                    </div>
                    <div className="analysis-stat-card">
                      <div className="analysis-stat-label">Total Selected</div>
                      <div className="analysis-stat-value">
                        {summaryStats.totalSelected}
                      </div>
                      <div className="analysis-stat-subtext">
                        {summaryStats.maxSelected > 0
                          ? `Most: ${summaryStats.maxSelected}x`
                          : "No selections yet"}
                      </div>
                    </div>
                  </div>
                )}

                {insights.length > 0 && !isAdmin && (
                  <div className="analysis-insights">
                    {insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`analysis-insight analysis-insight--${insight.type}`}
                      >
                        <span
                          className="analysis-insight-icon"
                          aria-hidden="true"
                        >
                          {insight.icon}
                        </span>
                        <span className="analysis-insight-text">
                          {insight.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="top-names-list">
                  <table
                    className="top-names-table"
                    role="table"
                    aria-label="Top performing cat names ranked by rating, wins, and selection count"
                  >
                    <thead>
                      <tr>
                        <th scope="col">Rank</th>
                        <th scope="col">Name</th>
                        <th
                          scope="col"
                          className="sortable"
                          onClick={() => handleSort("rating")}
                          style={{ cursor: "pointer" }}
                        >
                          {isAdmin ? (
                            <ColumnHeader
                              label={getMetricLabel("rating")}
                              metricName="rating"
                              sortable={true}
                              sorted={sortField === "rating"}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                          ) : (
                            <>Rating {renderSortIndicator("rating")}</>
                          )}
                        </th>
                        <th
                          scope="col"
                          className="sortable"
                          onClick={() => handleSort("wins")}
                          style={{ cursor: "pointer" }}
                        >
                          {isAdmin ? (
                            <ColumnHeader
                              label={getMetricLabel("total_wins")}
                              metricName="total_wins"
                              sortable={true}
                              sorted={sortField === "wins"}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                          ) : (
                            <>Wins {renderSortIndicator("wins")}</>
                          )}
                        </th>
                        <th
                          scope="col"
                          className="sortable"
                          onClick={() => handleSort("selected")}
                          style={{ cursor: "pointer" }}
                        >
                          {isAdmin ? (
                            <ColumnHeader
                              label={getMetricLabel("times_selected")}
                              metricName="times_selected"
                              sortable={true}
                              sorted={sortField === "selected"}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                          ) : (
                            <>Selected {renderSortIndicator("selected")}</>
                          )}
                        </th>
                        {isAdmin && (
                          <th scope="col">
                            <span className="column-header-label">
                              Insights
                            </span>
                          </th>
                        )}
                        <th
                          scope="col"
                          className="sortable"
                          onClick={() => handleSort("dateSubmitted")}
                          style={{ cursor: "pointer" }}
                        >
                          {isAdmin ? (
                            <ColumnHeader
                              label={getMetricLabel("created_at")}
                              metricName="created_at"
                              sortable={true}
                              sorted={sortField === "dateSubmitted"}
                              sortDirection={sortDirection}
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
                      {namesWithInsights.map((item, index) => {
                        const rank = index + 1;
                        const ratingPercent =
                          summaryStats && summaryStats.maxRating > 0
                            ? Math.min(
                                (item.rating / summaryStats.maxRating) * 100,
                                100,
                              )
                            : 0;
                        const winsPercent =
                          summaryStats && summaryStats.maxWins > 0
                            ? Math.min(
                                (item.wins / summaryStats.maxWins) * 100,
                                100,
                              )
                            : 0;
                        const selectedPercent =
                          summaryStats && summaryStats.maxSelected > 0
                            ? Math.min(
                                (item.selected / summaryStats.maxSelected) *
                                  100,
                                100,
                              )
                            : 0;

                        return (
                          <tr key={item.id || index} className="top-names-row">
                            <td className="top-names-rank" scope="row">
                              <span className="rank-badge rank-badge--top">
                                {isAdmin ? getRankDisplay(rank) : rank}
                              </span>
                            </td>
                            <td className="top-names-name">{item.name}</td>
                            <td className="top-names-rating-cell">
                              {isAdmin ? (
                                <div className="metric-with-insight">
                                  <span
                                    className="top-names-rating"
                                    aria-label={`Rating: ${item.rating} (${item.ratingPercentile}th percentile)`}
                                  >
                                    {item.rating}
                                  </span>
                                  <span className="metric-percentile">
                                    {item.ratingPercentile}%ile
                                  </span>
                                </div>
                              ) : (
                                <div className="metric-with-bar">
                                  <span
                                    className="top-names-rating"
                                    aria-label={`Rating: ${item.rating}`}
                                  >
                                    {item.rating}
                                  </span>
                                  <div className="metric-bar">
                                    <div
                                      className="metric-bar-fill metric-bar-fill--rating"
                                      style={{ width: `${ratingPercent}%` }}
                                      aria-hidden="true"
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="top-names-wins-cell">
                              {isAdmin ? (
                                <span
                                  className="top-names-wins"
                                  aria-label={`Wins: ${item.wins}`}
                                >
                                  {item.wins}
                                </span>
                              ) : (
                                <div className="metric-with-bar">
                                  <span
                                    className="top-names-wins"
                                    aria-label={`Wins: ${item.wins}`}
                                  >
                                    {item.wins}
                                  </span>
                                  <div className="metric-bar">
                                    <div
                                      className="metric-bar-fill metric-bar-fill--wins"
                                      style={{ width: `${winsPercent}%` }}
                                      aria-hidden="true"
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="top-names-selected-cell">
                              {isAdmin ? (
                                <span
                                  className="top-names-selected"
                                  aria-label={`Selected ${item.selected} times`}
                                >
                                  {item.selected}
                                </span>
                              ) : (
                                <div className="metric-with-bar">
                                  <span
                                    className="top-names-selected"
                                    aria-label={`Selected ${item.selected} times`}
                                  >
                                    {item.selected}
                                  </span>
                                  <div className="metric-bar">
                                    <div
                                      className="metric-bar-fill metric-bar-fill--selected"
                                      style={{ width: `${selectedPercent}%` }}
                                      aria-hidden="true"
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="top-names-insights-cell">
                                <PerformanceBadges types={item.insights} />
                              </td>
                            )}
                            <td className="top-names-date-cell">
                              {item.dateSubmitted ? (
                                <span
                                  className="top-names-date"
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
                                  className="top-names-date top-names-date--unknown"
                                  aria-label="Date unknown"
                                >
                                  —
                                </span>
                              )}
                            </td>
                            {canHideNames && (
                              <td className="top-names-actions">
                                <button
                                  type="button"
                                  className="top-names-hide-button"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      await handleHideName(item.id, item.name);
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
              </>
            )}

            {/* Insights View */}
            {viewMode === "insights" && (
              <div className="analysis-insights-panel">
                {summaryStats && !isAdmin && (
                  <div className="analysis-stats-summary">
                    <div className="analysis-stat-card">
                      <div className="analysis-stat-label">Top Rating</div>
                      <div className="analysis-stat-value">
                        {summaryStats.maxRating}
                      </div>
                      <div className="analysis-stat-name">
                        {summaryStats.topName?.name}
                      </div>
                    </div>
                    <div className="analysis-stat-card">
                      <div className="analysis-stat-label">Avg Rating</div>
                      <div className="analysis-stat-value">
                        {summaryStats.avgRating}
                      </div>
                      <div className="analysis-stat-subtext">
                        Across {displayNames.length} names
                      </div>
                    </div>
                    <div className="analysis-stat-card">
                      <div className="analysis-stat-label">Total Selected</div>
                      <div className="analysis-stat-value">
                        {summaryStats.totalSelected}
                      </div>
                      <div className="analysis-stat-subtext">
                        {summaryStats.maxSelected > 0
                          ? `Most: ${summaryStats.maxSelected}x`
                          : "No selections yet"}
                      </div>
                    </div>
                  </div>
                )}

                {insights.length > 0 && !isAdmin && (
                  <div className="analysis-insights">
                    {insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`analysis-insight analysis-insight--${insight.type}`}
                      >
                        <span
                          className="analysis-insight-icon"
                          aria-hidden="true"
                        >
                          {insight.icon}
                        </span>
                        <span className="analysis-insight-text">
                          {insight.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* * Show worst performers first for removal/hiding */}
                {namesWithInsights.some((n) =>
                  n.insights.some((i) =>
                    [
                      "worst_rated",
                      "never_selected",
                      "inactive",
                      "poor_performer",
                    ].includes(i),
                  ),
                ) && (
                  <div className="analysis-insights-section">
                    <h3 className="analysis-insights-section-title">
                      ⚠️ Names to Consider Hiding
                    </h3>
                    <div className="analysis-insight-cards">
                      {namesWithInsights
                        .filter((n) =>
                          n.insights.some((i) =>
                            [
                              "worst_rated",
                              "never_selected",
                              "inactive",
                              "poor_performer",
                            ].includes(i),
                          ),
                        )
                        .sort((a, b) => {
                          // * Sort by worst first: inactive > never selected > worst rated > poor performer
                          const priority = {
                            inactive: 0,
                            never_selected: 1,
                            worst_rated: 2,
                            poor_performer: 3,
                          };
                          const aPriority = Math.min(
                            ...a.insights
                              .filter((i) =>
                                [
                                  "worst_rated",
                                  "never_selected",
                                  "inactive",
                                  "poor_performer",
                                ].includes(i),
                              )
                              .map((i) => priority[i] ?? 99),
                          );
                          const bPriority = Math.min(
                            ...b.insights
                              .filter((i) =>
                                [
                                  "worst_rated",
                                  "never_selected",
                                  "inactive",
                                  "poor_performer",
                                ].includes(i),
                              )
                              .map((i) => priority[i] ?? 99),
                          );
                          if (aPriority !== bPriority)
                            return aPriority - bPriority;
                          // * Then by rating (lowest first)
                          return a.rating - b.rating;
                        })
                        .slice(0, 12)
                        .map((n) => (
                          <div
                            key={n.id}
                            className="analysis-insight-card analysis-insight-card--warning"
                          >
                            <div className="analysis-insight-card-header">
                              <div className="analysis-insight-card-name">
                                {n.name}
                              </div>
                              {canHideNames && (
                                <button
                                  type="button"
                                  className="analysis-insight-card-hide"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      await handleHideName(n.id, n.name);
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
                            <div className="analysis-insight-card-metrics">
                              <span>Rating {Math.round(n.rating)}</span>
                              <span>{n.selected} selected</span>
                              {n.wins > 0 && <span>{n.wins} wins</span>}
                            </div>
                            <div className="analysis-insight-card-tags">
                              {n.insights
                                .filter((i) =>
                                  [
                                    "worst_rated",
                                    "never_selected",
                                    "inactive",
                                    "poor_performer",
                                  ].includes(i),
                                )
                                .map((tag) => (
                                  <span
                                    key={tag}
                                    className="analysis-insight-tag analysis-insight-tag--warning"
                                  >
                                    {tag.replace("_", " ")}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* * Show good performers for reference */}
                {namesWithInsights.some((n) =>
                  n.insights.some((i) =>
                    [
                      "top_rated",
                      "most_selected",
                      "underrated",
                      "undefeated",
                    ].includes(i),
                  ),
                ) && (
                  <div className="analysis-insights-section">
                    <h3 className="analysis-insights-section-title">
                      ✨ Top Performers (Keep)
                    </h3>
                    <div className="analysis-insight-cards">
                      {namesWithInsights
                        .filter((n) =>
                          n.insights.some((i) =>
                            [
                              "top_rated",
                              "most_selected",
                              "underrated",
                              "undefeated",
                            ].includes(i),
                          ),
                        )
                        .slice(0, 6)
                        .map((n) => (
                          <div key={n.id} className="analysis-insight-card">
                            <div className="analysis-insight-card-name">
                              {n.name}
                            </div>
                            <div className="analysis-insight-card-metrics">
                              <span>Rating {Math.round(n.rating)}</span>
                              <span>{n.selected} selected</span>
                            </div>
                            <div className="analysis-insight-card-tags">
                              {n.insights
                                .filter((i) =>
                                  [
                                    "top_rated",
                                    "most_selected",
                                    "underrated",
                                    "undefeated",
                                  ].includes(i),
                                )
                                .map((tag) => (
                                  <span
                                    key={tag}
                                    className="analysis-insight-tag"
                                  >
                                    {tag.replace("_", " ")}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CollapsibleContent>
    </AnalysisPanel>
  );
}

AnalysisDashboard.propTypes = {
  isAdmin: PropTypes.bool,
  userName: PropTypes.string,
  onNameHidden: PropTypes.func,
  highlights: PropTypes.shape({
    topRated: PropTypes.arrayOf(nameItemShape),
    mostWins: PropTypes.arrayOf(nameItemShape),
  }),
  showGlobalLeaderboard: PropTypes.bool,
  defaultCollapsed: PropTypes.bool,
  stats: PropTypes.object,
  selectionStats: PropTypes.object,
};

export default AnalysisDashboard;
