/**
 * @module AnalysisPanel/components/AnalysisFilters
 * @description Filter controls for Analysis Mode
 */

import PropTypes from "prop-types";

/**
 * Filter controls for Analysis Mode
 * @param {Object} props
 * @param {React.ReactNode} props.children - Filter inputs
 */
export function AnalysisFilters({ children }) {
  return <div className="analysis-filters">{children}</div>;
}

AnalysisFilters.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AnalysisFilters;
