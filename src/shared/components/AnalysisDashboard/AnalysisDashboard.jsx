/**
 * @module AnalysisDashboard
 * @description Redesigned dashboard for Analysis Mode.
 * Minimal, focused, with clear hierarchy and presence.
 */

import React from "react";
import PropTypes from "prop-types";
import {
  AnalysisPanel,
  AnalysisStats,
  AnalysisHighlights,
} from "../AnalysisPanel";

/**
 * Analysis Dashboard Component
 * Unified stats and highlights display for Analysis Mode
 *
 * @param {Object} props
 * @param {Object} props.stats - General statistics
 * @param {Object} props.selectionStats - Selection-specific statistics
 * @param {Object} props.highlights - Highlight groups (topRated, mostWins)
 */
export function AnalysisDashboard({ stats, selectionStats, highlights }) {
  // * Build stats array from props
  const statItems = [];

  if (stats?.names_rated != null) {
    statItems.push({
      value: stats.names_rated,
      label: "Rated",
      accent: true,
    });
  }

  const tournaments =
    selectionStats?.tournaments_participated ||
    stats?.tournaments_participated ||
    0;
  if (tournaments > 0) {
    statItems.push({
      value: tournaments,
      label: "Tournaments",
    });
  }

  const selections =
    selectionStats?.total_selections || stats?.total_selections || 0;
  if (selections > 0) {
    statItems.push({
      value: selections,
      label: "Selections",
    });
  }

  if (stats?.high_ratings != null && stats.high_ratings > 0) {
    statItems.push({
      value: stats.high_ratings,
      label: "High Rated",
    });
  }

  // * Build highlights array
  const highlightGroups = [];

  if (highlights?.topRated?.length > 0) {
    highlightGroups.push({
      title: "Top Rated",
      items: highlights.topRated.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
      })),
    });
  }

  if (highlights?.mostWins?.length > 0) {
    highlightGroups.push({
      title: "Most Wins",
      items: highlights.mostWins.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
      })),
    });
  }

  // * Don't render if no data
  if (statItems.length === 0 && highlightGroups.length === 0) {
    return null;
  }

  return (
    <AnalysisPanel showHeader={false}>
      {statItems.length > 0 && <AnalysisStats stats={statItems} />}
      {highlightGroups.length > 0 && (
        <AnalysisHighlights highlights={highlightGroups} />
      )}
    </AnalysisPanel>
  );
}

AnalysisDashboard.propTypes = {
  stats: PropTypes.shape({
    names_rated: PropTypes.number,
    tournaments_participated: PropTypes.number,
    total_selections: PropTypes.number,
    high_ratings: PropTypes.number,
  }),
  selectionStats: PropTypes.shape({
    tournaments_participated: PropTypes.number,
    total_selections: PropTypes.number,
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
};

export default AnalysisDashboard;
