/**
 * @module AnalysisPanel/components/AnalysisBadge
 * @description Analysis mode indicator badge
 */

import PropTypes from "prop-types";

/**
 * Analysis mode indicator badge
 * @param {Object} props
 * @param {string} props.text - Badge text (default: "Analysis Mode")
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisBadge({ text = "Analysis Mode", className = "" }) {
  return (
    <span
      className={`analysis-badge ${className}`}
      role="status"
      aria-live="polite"
    >
      {text}
    </span>
  );
}

AnalysisBadge.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
};
