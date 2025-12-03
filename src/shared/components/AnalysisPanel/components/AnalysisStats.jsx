/**
 * @module AnalysisPanel/components/AnalysisStats
 * @description Stats display for Analysis Mode
 *
 * Displays statistics in a grid layout using analysis-mode design tokens.
 * For individual stat cards outside analysis mode, use StatsCard component.
 *
 * @see StatsCard - For individual stat cards in general UI contexts
 */

import PropTypes from "prop-types";

/**
 * Stats display for Analysis Mode
 * Displays multiple stats in a responsive grid layout
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects { value, label, accent? }
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisStats({ stats, className = "" }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className={`analysis-stats ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={stat.label || index}
          className={`analysis-stat ${stat.accent ? "analysis-stat--accent" : ""}`}
        >
          <span className="analysis-stat-value">{stat.value}</span>
          <span className="analysis-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

AnalysisStats.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
      accent: PropTypes.bool,
    }),
  ).isRequired,
  className: PropTypes.string,
};

export default AnalysisStats;
