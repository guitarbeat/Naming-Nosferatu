/**
 * @module AnalysisDashboard
 * @description Redesigned dashboard for Analysis Mode.
 * Fetches real data from the database for accurate analytics.
 * Supports collapsible sections for better UX.
 */

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { AnalysisPanel, AnalysisStats } from "../AnalysisPanel";
import { catNamesAPI } from "../../services/supabase/api";
import { useCollapsible } from "../../hooks/useCollapsible";

const STORAGE_KEY = "analysis-dashboard-collapsed";

/**
 * Simple CSS-based bar chart with rating display
 */
function SimpleBarChart({
  title,
  items,
  valueKey = "value",
  labelKey = "name",
  showRating = false,
}) {
  if (!items || items.length === 0) return null;

  const maxValue = Math.max(...items.map((item) => item[valueKey]), 1);

  return (
    <div className="analysis-chart">
      <h3 className="analysis-chart-title">{title}</h3>
      <div className="analysis-chart-bars">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.id || index} className="analysis-chart-row">
            <div className="analysis-chart-label" title={item[labelKey]}>
              {item[labelKey]}
            </div>
            <div className="analysis-chart-bar-container">
              <div
                className="analysis-chart-bar"
                style={{
                  width: `${(item[valueKey] / maxValue) * 100}%`,
                }}
              />
            </div>
            <div className="analysis-chart-value">
              {showRating && item.avg_rating ? (
                <span title={`Rating: ${item.avg_rating}`}>
                  {item[valueKey]} <small>({item.avg_rating})</small>
                </span>
              ) : (
                item[valueKey]
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

SimpleBarChart.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  showRating: PropTypes.bool,
};

/**
 * Analysis Dashboard Component
 * Fetches and displays real analytics from the database
 *
 * @param {Object} props
 * @param {Object} props.stats - General statistics (from props or fetched)
 * @param {Object} props.selectionStats - Selection-specific statistics
 * @param {Object} props.highlights - Highlight groups (topRated, mostWins)
 * @param {string} props.userName - Current user for personalized stats
 * @param {boolean} props.showGlobalLeaderboard - Whether to show global top names
 */
export function AnalysisDashboard({
  stats,
  selectionStats,
  highlights,
  userName,
  showGlobalLeaderboard = true,
  defaultCollapsed = false,
}) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectionPopularity, setSelectionPopularity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(STORAGE_KEY, defaultCollapsed);

  // Fetch global leaderboard and selection popularity data on mount
  useEffect(() => {
    if (!showGlobalLeaderboard) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [leaderboard, popularity] = await Promise.all([
          catNamesAPI.getLeaderboard(10),
          catNamesAPI.getSelectionPopularity(10),
        ]);
        setLeaderboardData(leaderboard);
        setSelectionPopularity(popularity);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch analytics:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showGlobalLeaderboard]);

  // Transform leaderboard data into chart format
  const globalTopRated = useMemo(() => {
    if (!leaderboardData?.length) return null;
    return leaderboardData
      .filter((item) => item.avg_rating > 1500)
      .slice(0, 5)
      .map((item) => ({
        id: item.name_id,
        name: item.name,
        value: item.avg_rating,
        avg_rating: item.avg_rating,
        total_ratings: item.total_ratings,
      }));
  }, [leaderboardData]);

  const globalMostWins = useMemo(() => {
    if (!leaderboardData?.length) return null;
    return [...leaderboardData]
      .filter((item) => item.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5)
      .map((item) => ({
        id: item.name_id,
        name: item.name,
        value: item.wins,
        avg_rating: item.avg_rating,
      }));
  }, [leaderboardData]);

  // Transform selection popularity into chart format
  const mostSelected = useMemo(() => {
    if (!selectionPopularity?.length) return null;
    return selectionPopularity.slice(0, 5).map((item) => ({
      id: item.name_id,
      name: item.name,
      value: item.times_selected,
    }));
  }, [selectionPopularity]);

  // Build stats array from props
  const statItems = useMemo(() => {
    const items = [];

    if (stats?.names_rated != null) {
      items.push({
        value: stats.names_rated,
        label: "Rated",
        accent: true,
      });
    }

    const tournaments =
      selectionStats?.totalTournaments ||
      selectionStats?.tournaments_participated ||
      stats?.tournaments_participated ||
      0;
    if (tournaments > 0) {
      items.push({
        value: tournaments,
        label: "Tournaments",
      });
    }

    const selections =
      selectionStats?.totalSelections ||
      selectionStats?.total_selections ||
      stats?.total_selections ||
      0;
    if (selections > 0) {
      items.push({
        value: selections,
        label: "Selections",
      });
    }

    // Show win rate if available
    const totalWins = stats?.total_wins || 0;
    const totalLosses = stats?.total_losses || 0;
    if (totalWins > 0 || totalLosses > 0) {
      const winRate =
        totalWins + totalLosses > 0
          ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
          : 0;
      items.push({
        value: `${winRate}%`,
        label: "Win Rate",
      });
    }

    if (stats?.high_ratings != null && stats.high_ratings > 0) {
      items.push({
        value: stats.high_ratings,
        label: "High Rated",
      });
    }

    return items;
  }, [stats, selectionStats]);

  // Use global data if no highlights provided
  const effectiveTopRated = highlights?.topRated?.length
    ? highlights.topRated
    : globalTopRated;
  const effectiveMostWins = highlights?.mostWins?.length
    ? highlights.mostWins
    : globalMostWins;

  // Don't render if no data at all
  const hasData =
    statItems.length > 0 ||
    effectiveTopRated?.length > 0 ||
    effectiveMostWins?.length > 0 ||
    isLoading;

  if (!hasData) {
    return null;
  }

  return (
    <AnalysisPanel showHeader={false}>
      {/* Collapsible header */}
      <button
        type="button"
        className="analysis-dashboard-header"
        onClick={toggleCollapsed}
        aria-expanded={!isCollapsed}
        aria-controls="analysis-dashboard-content"
      >
        <span className="analysis-dashboard-title">
          <span
            className={`analysis-dashboard-chevron ${isCollapsed ? "collapsed" : ""}`}
            aria-hidden="true"
          >
            ▼
          </span>
          <span aria-hidden="true">📊</span> Analytics
          {/* Show quick summary when collapsed */}
          {isCollapsed && statItems.length > 0 && (
            <span className="analysis-dashboard-summary">
              {statItems.slice(0, 3).map((stat, i) => (
                <span key={stat.label} className="analysis-dashboard-summary-item">
                  {i > 0 && " · "}
                  <strong>{stat.value}</strong> {stat.label}
                </span>
              ))}
            </span>
          )}
        </span>
        <span className="analysis-dashboard-hint">
          {isCollapsed ? "▸ Expand" : "▾ Minimize"}
        </span>
      </button>

      {/* Collapsible content */}
      <div
        id="analysis-dashboard-content"
        className={`analysis-dashboard-content ${isCollapsed ? "collapsed" : ""}`}
      >
        {statItems.length > 0 && <AnalysisStats stats={statItems} />}

        {isLoading ? (
          <div className="analysis-loading">Loading analytics...</div>
        ) : (
          <div className="analysis-charts-grid">
            {effectiveTopRated?.length > 0 && (
              <SimpleBarChart
                title={userName ? "Your Top Rated" : "Global Top Rated"}
                items={effectiveTopRated}
              />
            )}

            {effectiveMostWins?.length > 0 && (
              <SimpleBarChart
                title={userName ? "Your Most Wins" : "Global Most Wins"}
                items={effectiveMostWins}
                showRating
              />
            )}

            {mostSelected?.length > 0 && (
              <SimpleBarChart
                title="Most Selected for Tournaments"
                items={mostSelected}
              />
            )}
          </div>
        )}
      </div>
    </AnalysisPanel>
  );
}

AnalysisDashboard.propTypes = {
  stats: PropTypes.shape({
    names_rated: PropTypes.number,
    tournaments_participated: PropTypes.number,
    total_selections: PropTypes.number,
    high_ratings: PropTypes.number,
    total_wins: PropTypes.number,
    total_losses: PropTypes.number,
  }),
  selectionStats: PropTypes.shape({
    tournaments_participated: PropTypes.number,
    totalTournaments: PropTypes.number,
    total_selections: PropTypes.number,
    totalSelections: PropTypes.number,
  }),
  highlights: PropTypes.shape({
    topRated: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
    mostWins: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  }),
  userName: PropTypes.string,
  showGlobalLeaderboard: PropTypes.bool,
  defaultCollapsed: PropTypes.bool,
};

export default AnalysisDashboard;
