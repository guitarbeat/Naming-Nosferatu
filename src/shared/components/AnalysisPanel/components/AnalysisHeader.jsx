/**
 * @module AnalysisPanel/components/AnalysisHeader
 * @description Analysis panel header with mode indicator and optional collapsible functionality
 */

import PropTypes from "prop-types";
import { AnalysisBadge } from "./AnalysisBadge";

/**
 * Analysis panel header with mode indicator
 * Supports both static and collapsible modes
 * @param {Object} props
 * @param {string} props.title - Optional panel title
 * @param {React.ReactNode} props.actions - Optional header action buttons
 * @param {boolean} props.showBadge - Whether to show the analysis badge (default: true)
 * @param {boolean} props.collapsible - Whether header is collapsible (default: false)
 * @param {boolean} props.isCollapsed - Current collapsed state (when collapsible)
 * @param {Function} props.onToggle - Toggle handler (when collapsible)
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {string} props.icon - Emoji icon (optional)
 * @param {string} props.contentId - ID of the controlled content for a11y
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisHeader({
  title,
  actions,
  showBadge = true,
  collapsible = false,
  isCollapsed,
  onToggle,
  summary,
  icon,
  contentId,
  className = "",
}) {
  const HeaderTag = collapsible ? "div" : "header";
  const headerClasses = collapsible
    ? `analysis-header analysis-header--collapsible ${className}`
    : `analysis-header ${className}`;

  const content = (
    <div className="analysis-header-content">
      {icon && <span aria-hidden="true">{icon}</span>}
      {showBadge && <AnalysisBadge />}
      {title && <h2 className="analysis-title">{title}</h2>}
      {collapsible && isCollapsed && summary && (
        <span className="analysis-header-summary">{summary}</span>
      )}
    </div>
  );

  return (
    <HeaderTag className={headerClasses}>
      {collapsible ? (
        <button
          type="button"
          className="analysis-header-toggle"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
        >
          <span
            className={`analysis-header-chevron ${isCollapsed ? "collapsed" : ""}`}
            aria-hidden="true"
          >
            ▼
          </span>
          {content}
        </button>
      ) : (
        content
      )}
      {actions && <div className="analysis-header-actions">{actions}</div>}
    </HeaderTag>
  );
}

AnalysisHeader.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node,
  showBadge: PropTypes.bool,
  collapsible: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  summary: PropTypes.node,
  icon: PropTypes.string,
  contentId: PropTypes.string,
  className: PropTypes.string,
};

export default AnalysisHeader;
