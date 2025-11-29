/**
 * @module CollapsibleHeader
 * @description Reusable collapsible header component for panels and sections.
 * Provides consistent styling and accessibility for collapsible UI patterns.
 */

import PropTypes from "prop-types";
import "./CollapsibleHeader.css";

/**
 * Collapsible Header Component
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {string} props.icon - Emoji icon (optional)
 * @param {boolean} props.isCollapsed - Current collapsed state
 * @param {Function} props.onToggle - Toggle handler
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {React.ReactNode} props.actions - Action buttons (optional)
 * @param {string} props.contentId - ID of the controlled content for a11y
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Style variant: 'default' | 'compact'
 */
export function CollapsibleHeader({
  title,
  icon,
  isCollapsed,
  onToggle,
  summary,
  actions,
  contentId,
  className = "",
  variant = "default",
}) {
  return (
    <div className={`collapsible-header collapsible-header--${variant} ${className}`}>
      <button
        type="button"
        className="collapsible-header-toggle"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-controls={contentId}
      >
        <span
          className={`collapsible-header-chevron ${isCollapsed ? "collapsed" : ""}`}
          aria-hidden="true"
        >
          ▼
        </span>
        {icon && <span aria-hidden="true">{icon}</span>}
        <span className="collapsible-header-title">{title}</span>
        {isCollapsed && summary && (
          <span className="collapsible-header-summary">{summary}</span>
        )}
      </button>
      {actions && (
        <div className="collapsible-header-actions">{actions}</div>
      )}
    </div>
  );
}

CollapsibleHeader.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  isCollapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  summary: PropTypes.node,
  actions: PropTypes.node,
  contentId: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "compact"]),
};

/**
 * Collapsible Content wrapper with animation
 * @param {Object} props
 * @param {string} props.id - Content ID for a11y
 * @param {boolean} props.isCollapsed - Current collapsed state
 * @param {React.ReactNode} props.children - Content
 * @param {string} props.className - Additional CSS classes
 */
export function CollapsibleContent({
  id,
  isCollapsed,
  children,
  className = "",
}) {
  return (
    <div
      id={id}
      className={`collapsible-content ${isCollapsed ? "collapsed" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

CollapsibleContent.propTypes = {
  id: PropTypes.string,
  isCollapsed: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default CollapsibleHeader;
