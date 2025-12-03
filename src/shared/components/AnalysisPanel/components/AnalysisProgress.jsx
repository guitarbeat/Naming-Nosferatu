/**
 * @module AnalysisPanel/components/AnalysisProgress
 * @description Progress indicator
 */

import PropTypes from "prop-types";

/**
 * Progress indicator
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {number} props.max - Maximum value
 * @param {string} props.label - Optional label
 */
export function AnalysisProgress({ value, max, label }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="analysis-progress">
      <div
        className="analysis-progress-bar"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
      >
        <div
          className="analysis-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="analysis-progress-text">
        {label || `${value}/${max}`}
      </span>
    </div>
  );
}

AnalysisProgress.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  label: PropTypes.string,
};

export default AnalysisProgress;
