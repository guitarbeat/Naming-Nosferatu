/**
 * @module AdminAnalytics
 * @description Admin-only analytics dashboard showing comprehensive popularity metrics.
 * Displays selection frequency, ratings, wins, and engagement data.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { AnalysisPanel, AnalysisStats, AnalysisButton } from "../AnalysisPanel";
import { CollapsibleHeader, CollapsibleContent } from "../CollapsibleHeader";
import { catNamesAPI } from "../../services/supabase/api";
import { useCollapsible } from "../../hooks/useCollapsible";
import { formatRelativeTime } from "../../utils/timeUtils";
import "./AdminAnalytics.css";

const STORAGE_KEY = "admin-analytics-collapsed";

/**
 * Popularity table row component
 */
function PopularityRow({ item, rank }) {
  const getRankEmoji = (r) => {
    if (r === 1) return "🥇";
    if (r === 2) return "🥈";
    if (r === 3) return "🥉";
    return r;
  };

  return (
    <tr className="admin-analytics-row">
      <td className="admin-analytics-rank">{getRankEmoji(rank)}</td>
      <td className="admin-analytics-name" title={item.description}>
        {item.name}
      </td>
      <td className="admin-analytics-value">{item.times_selected}</td>
      <td className="admin-analytics-value">{item.unique_selectors}</td>
      <td className="admin-analytics-value admin-analytics-rating">
        {item.avg_rating}
      </td>
      <td className="admin-analytics-value">{item.total_wins}</td>
      <td className="admin-analytics-value">{item.win_rate}%</td>
      <td className="admin-analytics-value">{item.users_rated}</td>
      <td className="admin-analytics-score">{item.popularity_score}</td>
    </tr>
  );
}

PopularityRow.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    times_selected: PropTypes.number,
    unique_selectors: PropTypes.number,
    avg_rating: PropTypes.number,
    total_wins: PropTypes.number,
    win_rate: PropTypes.number,
    users_rated: PropTypes.number,
    popularity_score: PropTypes.number,
  }).isRequired,
  rank: PropTypes.number.isRequired,
};

/**
 * Admin Analytics Dashboard Component
 * Shows comprehensive popularity metrics for all names
 */
export function AdminAnalytics({ isAdmin = false }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [siteStats, setSiteStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState("popularity_score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(STORAGE_KEY, false);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      const [popularityData, stats] = await Promise.all([
        catNamesAPI.getPopularityAnalytics(50),
        catNamesAPI.getSiteStats(),
      ]);
      setAnalyticsData(popularityData);
      setSiteStats(stats);
      setLastRefresh(new Date());
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch admin analytics:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Fetch on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Sort data based on current sort field
  const sortedData = useMemo(() => {
    if (!analyticsData) return [];
    return [...analyticsData].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [analyticsData, sortField, sortDirection]);

  // Calculate summary stats from site stats
  const summaryStats = useMemo(() => {
    if (!siteStats) return [];

    return [
      { value: siteStats.activeNames, label: "Active Names", accent: true },
      { value: siteStats.totalUsers, label: "Users" },
      { value: siteStats.totalRatings, label: "Ratings" },
      { value: siteStats.totalSelections, label: "Selections" },
      { value: siteStats.avgRating, label: "Avg Rating" },
      { value: siteStats.hiddenNames, label: "Hidden" },
    ];
  }, [siteStats]);

  // Handle column header click for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return <span className="sort-indicator">{sortDirection === "desc" ? "↓" : "↑"}</span>;
  };

  if (!isAdmin) {
    return null;
  }

  // Build summary for collapsed state
  const collapsedSummary = summaryStats.length > 0 
    ? `${summaryStats[0].value} ${summaryStats[0].label}`
    : null;

  // Build refresh actions
  const headerActions = (
    <>
      {lastRefresh && (
        <span className="admin-analytics-refresh-time">
          Updated {formatRelativeTime(lastRefresh)}
        </span>
      )}
      <AnalysisButton
        variant="ghost"
        onClick={fetchAnalytics}
        disabled={isLoading}
        ariaLabel="Refresh analytics data"
        title="Refresh data"
      >
        <span aria-hidden="true">{isLoading ? "⏳" : "🔄"}</span>
      </AnalysisButton>
    </>
  );

  return (
    <AnalysisPanel showHeader={false}>
      <CollapsibleHeader
        title="Popularity Analytics"
        icon="📈"
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        summary={collapsedSummary}
        actions={headerActions}
        contentId="admin-analytics-content"
      />

      <CollapsibleContent id="admin-analytics-content" isCollapsed={isCollapsed}>
        {summaryStats.length > 0 && <AnalysisStats stats={summaryStats} />}

        {isLoading ? (
          <div className="analysis-loading">Loading popularity analytics...</div>
        ) : (
          <div className="admin-analytics-table-container">
            <table className="admin-analytics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("times_selected")}
                  >
                    Selected {renderSortIndicator("times_selected")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("unique_selectors")}
                  >
                    Users {renderSortIndicator("unique_selectors")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("avg_rating")}
                  >
                    Rating {renderSortIndicator("avg_rating")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("total_wins")}
                  >
                    Wins {renderSortIndicator("total_wins")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("win_rate")}
                  >
                    Win% {renderSortIndicator("win_rate")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("users_rated")}
                  >
                    Raters {renderSortIndicator("users_rated")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("popularity_score")}
                  >
                    Score {renderSortIndicator("popularity_score")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <PopularityRow
                    key={item.name_id}
                    item={item}
                    rank={index + 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-analytics-legend">
          <p>
            <strong>Score</strong> = (Selections × 2) + (Wins × 1.5) + ((Rating - 1500) × 0.5)
          </p>
        </div>

        {/* Names needing attention */}
        {siteStats?.neverSelectedNames?.length > 0 && (
          <div className="admin-analytics-attention">
            <h4>⚠️ Never Selected ({siteStats.neverSelectedCount} names)</h4>
            <p className="attention-description">
              These names have never been chosen for a tournament:
            </p>
            <div className="attention-names">
              {siteStats.neverSelectedNames.map((name) => (
                <span key={name} className="attention-name-tag">
                  {name}
                </span>
              ))}
              {siteStats.neverSelectedCount > 10 && (
                <span className="attention-more">
                  +{siteStats.neverSelectedCount - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </AnalysisPanel>
  );
}

AdminAnalytics.propTypes = {
  isAdmin: PropTypes.bool,
};

export default AdminAnalytics;
