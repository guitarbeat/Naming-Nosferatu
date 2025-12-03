/**
 * @module AnalysisDashboard
 * @description Shows top performing names to help users choose a name for their cat.
 * Displays a consolidated table with Rating, Wins, and Selected counts.
 */

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { AnalysisPanel } from "../AnalysisPanel";
import { CollapsibleHeader, CollapsibleContent } from "../CollapsibleHeader";
import { catNamesAPI } from "../../services/supabase/api";
import { useCollapsible } from "../../hooks/useCollapsible";
import { STORAGE_KEYS } from "../../../core/constants";
import { devError } from "../../utils/logger";
import { nameItemShape } from "../../propTypes";
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
  userName: _userName, // * Unused - kept for compatibility
  showGlobalLeaderboard = true,
  defaultCollapsed = false,
}) {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [selectionPopularity, setSelectionPopularity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collapsed state with localStorage persistence
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    STORAGE_KEYS.ANALYSIS_DASHBOARD_COLLAPSED,
    defaultCollapsed,
  );

  // Fetch global leaderboard and selection popularity data on mount
  useEffect(() => {
    if (!showGlobalLeaderboard) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [leaderboard, popularity] = await Promise.all([
          catNamesAPI.getLeaderboard(10),
          catNamesAPI.getSelectionPopularity(10),
        ]);
        setLeaderboardData(leaderboard);
        setSelectionPopularity(popularity);
      } catch (err) {
        devError("Failed to fetch analytics:", err);
        setError("Failed to load top names. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showGlobalLeaderboard]);

  // * Consolidate all data into a single unified list
  // * Combine leaderboard and selection data to show top names with all metrics
  const consolidatedNames = useMemo(() => {
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
  }, [leaderboardData, selectionPopularity]);

  // Use highlights if provided, otherwise use consolidated data
  const displayNames = useMemo(() => {
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
  }, [highlights, consolidatedNames]);

  // Don't render if no data and not loading/error
  const hasData = displayNames.length > 0 || isLoading || error;

  if (!hasData) {
    return null;
  }

  return (
    <AnalysisPanel showHeader={false}>
      <CollapsibleHeader
        title="Top Names"
        icon="📊"
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
          <div className="top-names-list">
            <table
              className="top-names-table"
              role="table"
              aria-label="Top performing cat names ranked by rating, wins, and selection count"
            >
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Wins</th>
                  <th scope="col">Selected</th>
                </tr>
              </thead>
              <tbody>
                {displayNames.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="top-names-name" scope="row">
                      {item.name}
                    </td>
                    <td
                      className="top-names-rating"
                      aria-label={`Rating: ${item.rating}`}
                    >
                      {item.rating}
                    </td>
                    <td
                      className="top-names-wins"
                      aria-label={`Wins: ${item.wins}`}
                    >
                      {item.wins}
                    </td>
                    <td
                      className="top-names-selected"
                      aria-label={`Selected ${item.selected} times`}
                    >
                      {item.selected}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleContent>
    </AnalysisPanel>
  );
}

AnalysisDashboard.propTypes = {
  highlights: PropTypes.shape({
    topRated: PropTypes.arrayOf(nameItemShape),
    mostWins: PropTypes.arrayOf(nameItemShape),
  }),
  userName: PropTypes.string,
  showGlobalLeaderboard: PropTypes.bool,
  defaultCollapsed: PropTypes.bool,
};

export default AnalysisDashboard;
