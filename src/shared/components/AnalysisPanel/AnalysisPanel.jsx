/**
 * @module AnalysisPanel
 * @description Unified container component for Analysis Mode.
 * Provides a cohesive visual wrapper with consistent styling and layout.
 */

import PropTypes from "prop-types";
import "../../styles/analysis-mode.css";
import { AnalysisHeader } from "./components";

/**
 * Primary Analysis Panel container
 * @param {Object} props
 * @param {React.ReactNode} props.children - Panel content
 * @param {string} props.title - Optional panel title
 * @param {React.ReactNode} props.actions - Optional header action buttons
 * @param {boolean} props.showHeader - Whether to show the header
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisPanel({
  children,
  title,
  actions,
  showHeader = true,
  className = "",
}) {
  return (
    <div className={`analysis-panel ${className}`}>
      {showHeader && <AnalysisHeader title={title} actions={actions} />}
      {children}
    </div>
  );
}

AnalysisPanel.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  actions: PropTypes.node,
  showHeader: PropTypes.bool,
  className: PropTypes.string,
};

// Re-export all sub-components for backward compatibility
export {
  AnalysisBadge,
  AnalysisHeader,
  AnalysisStats,
  AnalysisToolbar,
  AnalysisButton,
  AnalysisFilters,
  AnalysisFilter,
  AnalysisSearch,
  AnalysisHighlights,
  AnalysisProgress,
  AnalysisToggle,
  AnalysisModeBanner,
} from "./components";

export default AnalysisPanel;
