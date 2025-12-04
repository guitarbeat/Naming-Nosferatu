/**
 * @module AnalysisDashboard
 * @description Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table with Rating, Wins, and Selected counts.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { AnalysisPanel } from "../AnalysisPanel";
import { CollapsibleHeader, CollapsibleContent } from "../CollapsibleHeader";
import { catNamesAPI, hiddenNamesAPI } from "../../services/supabase/api";
import { useCollapsible } from "../../hooks/useCollapsible";
import { STORAGE_KEYS } from "../../../core/constants";
import { devError, devLog } from "../../utils/logger";
import { nameItemShape } from "../../propTypes";
import { getRankDisplay } from "../../utils/displayUtils";
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
  stats: _stats, // * Unused - kept for compatibility
  selectionStats: _selectionStats, // * Unused - kept for compatibility
  highlights,
  userName,
  showGlobalLeaderboard = true,
  defaultCollapsed = false,
  isAdmin = false, // * Add admin prop to enable full analytics
  onNameHidden, // * Callback when a name is hidden
}) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectionPopularity, setSelectionPopularity] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null); // * Admin: full analytics
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("rating"); // * Add sorting for admin
  const [sortDirection, setSortDirection] = useState("desc");

  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    STORAGE_KEYS.ANALYSIS_DASHBOARD_COLLAPSED,
    defaultCollapsed
  );

  // Fetch global leaderboard and selection popularity data on mount
  useEffect(() => {
    if (!showGlobalLeaderboard) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (isAdmin) {
          // * Admin: fetch full analytics (all names) - use getPopularityAnalytics for complete data
          const analytics = await catNamesAPI.getPopularityAnalytics(50);
          setAnalyticsData(analytics);
          // * Also fetch leaderboard/popularity for fallback
          const [leaderboard, popularity] = await Promise.all([
            catNamesAPI.getLeaderboard(50),
            catNamesAPI.getSelectionPopularity(50),
          ]);
          setLeaderboardData(leaderboard);
          setSelectionPopularity(popularity);
        } else {
          // * Regular: fetch top 10
          const [leaderboard, popularity] = await Promise.all([
            catNamesAPI.getLeaderboard(10),
            catNamesAPI.getSelectionPopularity(10),
          ]);
          setLeaderboardData(leaderboard);
          setSelectionPopularity(popularity);
        }
      } catch (err) {
        devError("Failed to fetch analytics:", err);
        setError("Failed to load top names. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showGlobalLeaderboard, isAdmin]);

  // * Consolidate all data into a single unified list
  // * For admin: use full analytics data, for regular users: combine leaderboard and selection
  const consolidatedNames = useMemo(() => {
    // * Admin mode: use full analytics data (all names with complete metrics)
    if (isAdmin && analyticsData?.length) {
      return analyticsData.map((item) => ({
        id: item.name_id,
        name: item.name,
        rating: item.avg_rating || 1500,
        wins: item.total_wins || 0,
        selected: item.times_selected || 0,
      }));
    }

    // * Regular mode: combine leaderboard and selection data
    const nameMap = new Map();

    // Add leaderboard data
    if (leaderboardData?.length) {
      leaderboardData.forEach((item) => {
        if (item.avg_rating > 1500 || item.wins > 0) {
          nameMap.set(item.name_id, {
            id: item.name_id,
            name: item.name,
            rating: item.avg_rating || 1500,
            wins: item.wins || 0,
            selected: 0,
          });
        }
      });
    }

    // Add selection data
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
          });
        }
      });
    }

    // Sort by rating (most important for choosing a name), then by wins
    return Array.from(nameMap.values())
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.wins - a.wins;
      })
      .slice(0, 10); // Top 10 names
  }, [leaderboardData, selectionPopularity, analyticsData, isAdmin]);

  // * Handle sorting for admin mode
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    },
    [sortField]
  );

  // * Render sort indicator
  const renderSortIndicator = useCallback(
    (field) => {
      if (sortField !== field) return null;
      return (
        <span className="sort-indicator">
          {sortDirection === "desc" ? "↓" : "↑"}
        </span>
      );
    },
    [sortField, sortDirection]
  );

  // * Handle hiding a name
  const handleHideName = useCallback(
    async (nameId, name) => {
      if (!isAdmin || !userName) {
        devError("[AnalysisDashboard] Cannot hide: not admin or no userName");
        return;
      }

      try {
        devLog("[AnalysisDashboard] Hiding name", { nameId, name, userName });
        await hiddenNamesAPI.hideName(userName, nameId);
        if (onNameHidden) {
          onNameHidden(nameId);
        }
        // * Refresh data after hiding
        const fetchData = async () => {
          setIsLoading(true);
          try {
            if (isAdmin) {
              const analytics = await catNamesAPI.getPopularityAnalytics(50);
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
          } finally {
            setIsLoading(false);
          }
        };
        fetchData();
      } catch (error) {
        devError("[AnalysisDashboard] Error hiding name:", error);
        throw error;
      }
    },
    [isAdmin, userName, onNameHidden]
  );

  // Use highlights if provided, otherwise use consolidated data
  const displayNames = useMemo(() => {
    // * Admin mode: apply sorting to consolidated data
    if (isAdmin && consolidatedNames.length > 0) {
      const sorted = [...consolidatedNames].sort((a, b) => {
        const aVal = a[sortField] ?? 0;
        const bVal = b[sortField] ?? 0;
        return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
      });
      return sorted;
    }

    // * Regular mode: use highlights if provided
    if (highlights?.topRated?.length) {
      // If highlights provided, combine them with consolidated data
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
      return Array.from(highlightMap.values())
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);
    }
    return consolidatedNames;
  }, [highlights, consolidatedNames, isAdmin, sortField, sortDirection]);

  // * Calculate summary stats for quick overview
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

  // * Generate insights based on data
  const insights = useMemo(() => {
    if (!summaryStats || displayNames.length === 0) return [];

    const result = [];

    if (summaryStats.topName) {
      result.push({
        type: "top",
        message: `${summaryStats.topName.name} leads with a rating of ${summaryStats.topName.rating}`,
        icon: "🏆",
      });
    }

    if (summaryStats.maxSelected > 0) {
      const mostSelected = displayNames.find(
        (n) => n.selected === summaryStats.maxSelected
      );
      if (mostSelected) {
        result.push({
          type: "popular",
          message: `${mostSelected.name} is the most selected (${summaryStats.maxSelected}x)`,
          icon: "⭐",
        });
      }
    }

    if (summaryStats.avgRating > 1600) {
      result.push({
        type: "quality",
        message: `High average rating of ${summaryStats.avgRating} indicates strong contenders`,
        icon: "✨",
      });
    }

    return result;
  }, [summaryStats, displayNames]);

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
            {/* Quick Stats Summary - hide for admin (table shows all data) */}
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

            {/* Insights - hide for admin (table shows all data) */}
            {insights.length > 0 && !isAdmin && (
              <div className="analysis-insights">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`analysis-insight analysis-insight--${insight.type}`}
                  >
                    <span className="analysis-insight-icon" aria-hidden="true">
                      {insight.icon}
                    </span>
                    <span className="analysis-insight-text">
                      {insight.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Table */}
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
                      className={isAdmin ? "sortable" : ""}
                      onClick={isAdmin ? () => handleSort("rating") : undefined}
                      style={isAdmin ? { cursor: "pointer" } : undefined}
                    >
                      Rating {isAdmin && renderSortIndicator("rating")}
                    </th>
                    <th
                      scope="col"
                      className={isAdmin ? "sortable" : ""}
                      onClick={isAdmin ? () => handleSort("wins") : undefined}
                      style={isAdmin ? { cursor: "pointer" } : undefined}
                    >
                      Wins {isAdmin && renderSortIndicator("wins")}
                    </th>
                    <th
                      scope="col"
                      className={isAdmin ? "sortable" : ""}
                      onClick={
                        isAdmin ? () => handleSort("selected") : undefined
                      }
                      style={isAdmin ? { cursor: "pointer" } : undefined}
                    >
                      Selected {isAdmin && renderSortIndicator("selected")}
                    </th>
                    {isAdmin && <th scope="col">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayNames.map((item, index) => {
                    const rank = index + 1;
                    const ratingPercent =
                      summaryStats && summaryStats.maxRating > 0
                        ? Math.min(
                            (item.rating / summaryStats.maxRating) * 100,
                            100
                          )
                        : 0;
                    const winsPercent =
                      summaryStats && summaryStats.maxWins > 0
                        ? Math.min(
                            (item.wins / summaryStats.maxWins) * 100,
                            100
                          )
                        : 0;
                    const selectedPercent =
                      summaryStats && summaryStats.maxSelected > 0
                        ? Math.min(
                            (item.selected / summaryStats.maxSelected) * 100,
                            100
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
                            <span
                              className="top-names-rating"
                              aria-label={`Rating: ${item.rating}`}
                            >
                              {item.rating}
                            </span>
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
                                    error
                                  );
                                  // * Error will be handled by handleHideName
                                }
                              }}
                              aria-label={`Hide ${item.name}`}
                              title="Hide this name from tournaments"
                            >
                              <span aria-hidden="true">🙈</span>
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
};

export default AnalysisDashboard;
