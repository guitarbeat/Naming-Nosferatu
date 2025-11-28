/**
 * @module AnalysisDashboard
 * @description Redesigned dashboard for Analysis Mode.
 * Minimal, focused, with clear hierarchy and presence.
 */

import React from "react";
import PropTypes from "prop-types";
import { AnalysisPanel, AnalysisStats } from "../AnalysisPanel";

/**
 * Simple CSS-based bar chart
 */
function SimpleBarChart({
  title,
  items,
  valueKey = "value",
  labelKey = "name",
}) {
  if (!items || items.length === 0) return null;

  const maxValue = Math.max(...items.map((item) => item[valueKey]));

  return (
    <div className="analysis-chart">
      <h3 className="analysis-chart-title">{title}</h3>
      <div className="analysis-chart-bars">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="analysis-chart-row">
            <div className="analysis-chart-label">{item[labelKey]}</div>
            <div className="analysis-chart-bar-container">
              <div
                className="analysis-chart-bar"
                style={{
                  width: `${(item[valueKey] / maxValue) * 100}%`,
                }}
              />
            </div>
            <div className="analysis-chart-value">{item[valueKey]}</div>
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
};

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

  // * Don't render if no data
  if (statItems.length === 0 && !highlights) {
    return null;
  }

  return (
    <AnalysisPanel showHeader={false}>
      {statItems.length > 0 && <AnalysisStats stats={statItems} />}

      <div className="analysis-charts-grid">
        {highlights?.topRated?.length > 0 && (
          <SimpleBarChart title="Top Rated" items={highlights.topRated} />
        )}

        {highlights?.mostWins?.length > 0 && (
          <SimpleBarChart title="Most Wins" items={highlights.mostWins} />
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
