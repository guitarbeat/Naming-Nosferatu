/**
 * @module CollapsibleSection
 * @description Reusable collapsible section component with consistent styling.
 * Used by AnalysisDashboard, AdminAnalytics, and other collapsible panels.
 */

import PropTypes from "prop-types";
import { useCollapsible } from "../../hooks/useCollapsible";
import "./CollapsibleSection.css";

/**
 * Collapsible Section Component
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.icon - Emoji icon for the title
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {React.ReactNode} props.actions - Action buttons in header
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.storageKey - localStorage key for persistence
 * @param {boolean} props.defaultCollapsed - Default collapsed state
 * @param {string} props.className - Additional CSS classes
 */
export function CollapsibleSection({
  title,
  icon,
  summary,
  actions,
  children,
  storageKey = null,
  defaultCollapsed = false,
  className = "",
}) {
  const { isCollapsed, toggleCollapsed } = useCollapsible(
    storageKey,
    defaultCollapsed
  );

  const sectionId = `collapsible-${title?.toLowerCase().replace(/\s+/g, "-") || "section"}`;

  return (
    <div className={`collapsible-section ${className}`}>
      <div className="collapsible-section-header">
        <button
          type="button"
          className="collapsible-section-toggle"
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-controls={sectionId}
        >
          <span
            className={`collapsible-section-chevron ${isCollapsed ? "collapsed" : ""}`}
            aria-hidden="true"
          >
            ▼
          </span>
          {icon && <span aria-hidden="true">{icon}</span>}
          <span className="collapsible-section-title">{title}</span>
          {isCollapsed && summary && (
            <span className="collapsible-section-summary">{summary}</span>
          )}
        </button>
        {actions && (
          <div className="collapsible-section-actions">{actions}</div>
        )}
      </div>

      <div
        id={sectionId}
        className={`collapsible-section-content ${isCollapsed ? "collapsed" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  summary: PropTypes.node,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  storageKey: PropTypes.string,
  defaultCollapsed: PropTypes.bool,
  className: PropTypes.string,
};

export default CollapsibleSection;
