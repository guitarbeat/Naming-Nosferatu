/**
 * @module AdminAnalytics
 * @description Admin view of all names with key metrics for choosing a name.
 * Shows Selected count, Rating, and Wins - the metrics that matter for naming a cat.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { AnalysisPanel, AnalysisButton } from "../AnalysisPanel";
import { CollapsibleHeader, CollapsibleContent } from "../CollapsibleHeader";
import { catNamesAPI } from "../../services/supabase/api";
import { useCollapsible } from "../../hooks/useCollapsible";
import { formatRelativeTime } from "../../utils/timeUtils";
import { getRankDisplay } from "../../utils/displayUtils";
import { devError } from "../../utils/logger";
import { STORAGE_KEYS } from "../../../core/constants";
import "./AdminAnalytics.css";

/**
 * Popularity table row component
 */
function PopularityRow({ item, rank }) {
  return (
    <tr className="admin-analytics-row">
      <td className="admin-analytics-rank">{getRankDisplay(rank)}</td>
      <td className="admin-analytics-name" title={item.description}>
        {item.name}
      </td>
      <td className="admin-analytics-value">{item.times_selected}</td>
      <td className="admin-analytics-value admin-analytics-rating">
        {item.avg_rating}
      </td>
      <td className="admin-analytics-value">{item.total_wins}</td>
    </tr>
  );
}

PopularityRow.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    times_selected: PropTypes.number,
    avg_rating: PropTypes.number,
    total_wins: PropTypes.number,
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
  const [sortField, setSortField] = useState("avg_rating");
  const [sortDirection, setSortDirection] = useState("desc");
  const [lastRefresh, setLastRefresh] = useState(null);

  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    STORAGE_KEYS.ADMIN_ANALYTICS_COLLAPSED,
    false
  );

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
      devError("Failed to fetch admin analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Fetch on mount
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Sort data based on current sort field
  // * Default to rating (most useful for choosing a name)
  const sortedData = useMemo(() => {
    if (!analyticsData) return [];
    return [...analyticsData].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [analyticsData, sortField, sortDirection]);

  // * Summary stats removed - not useful for choosing a name

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

  // * No summary needed - table shows what matters

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
        title="All Names"
        icon="📈"
        isCollapsed={isCollapsed}
        onToggle={toggleCollapsed}
        actions={headerActions}
        contentId="admin-analytics-content"
      />

      <CollapsibleContent id="admin-analytics-content" isCollapsed={isCollapsed}>
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

        {/* * Score formula and "Never Selected" section removed - not useful for choosing a name */}
      </CollapsibleContent>
    </AnalysisPanel>
  );
}

AdminAnalytics.propTypes = {
  isAdmin: PropTypes.bool,
};

export default AdminAnalytics;
