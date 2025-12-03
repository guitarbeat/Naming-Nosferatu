/**
 * @module AnalysisPanel/components/AnalysisFilter
 * @description Individual filter control
 */

import PropTypes from "prop-types";

/**
 * Individual filter control
 * @param {Object} props
 * @param {string} props.label - Filter label
 * @param {React.ReactNode} props.children - Filter input
 */
export function AnalysisFilter({ label, children }) {
  return (
    <div className="analysis-filter">
      {label && <label className="analysis-filter-label">{label}</label>}
      {children}
    </div>
  );
}

AnalysisFilter.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default AnalysisFilter;
