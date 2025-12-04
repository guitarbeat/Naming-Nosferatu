/**
 * @module CollapsibleHeader
 * @description Simple, reusable collapsible header component.
 * KISS principle: minimal props, clear structure, consistent behavior.
 */

import PropTypes from "prop-types";
import "./CollapsibleHeader.css";

/**
 * Chevron icon component - simple SVG for better control
 */
const ChevronIcon = ({ isCollapsed }) => (
  <svg
    className={`collapsible-chevron ${isCollapsed ? "collapsed" : ""}`}
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

ChevronIcon.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
};

/**
 * Minimize icon component
 */
const MinimizeIcon = () => (
  <svg
    className="collapsible-minimize-icon"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3.5 7H10.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Collapsible Header Component
 * @param {Object} props
 * @param {string} props.title - Header title (required)
 * @param {string} props.icon - Emoji icon (optional)
 * @param {boolean} props.isCollapsed - Current collapsed state
 * @param {Function} props.onToggle - Toggle handler
 * @param {React.ReactNode} props.summary - Content to show when collapsed
 * @param {React.ReactNode} props.actions - Action buttons (optional)
 * @param {string} props.contentId - ID of the controlled content for a11y
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Style variant: 'default' | 'compact'
 * @param {boolean} props.showMinimize - Show minimize button (default: true)
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
  showMinimize = true,
}) {
  const handleMinimize = (e) => {
    e.stopPropagation();
    if (!isCollapsed) {
      onToggle();
    }
  };

  return (
    <header
      className={`collapsible-header collapsible-header--${variant} ${isCollapsed ? "collapsible-header--collapsed" : ""} ${className}`}
    >
      <button
        type="button"
        className="collapsible-toggle"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-controls={contentId}
        aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
        title={isCollapsed ? title : undefined}
      >
        <ChevronIcon isCollapsed={isCollapsed} />
        {isCollapsed ? (
          /* Minimal collapsed state - just icon if available */
          icon && <span className="collapsible-icon-collapsed" aria-hidden="true">{icon}</span>
        ) : (
          /* Expanded state - show icon and title */
          <>
            {icon && <span className="collapsible-icon" aria-hidden="true">{icon}</span>}
            <span className="collapsible-title">{title}</span>
          </>
        )}
        {isCollapsed && summary && (
          <span className="collapsible-summary">{summary}</span>
        )}
      </button>
      {!isCollapsed && (
        <div className="collapsible-header-controls">
          {actions && <div className="collapsible-actions">{actions}</div>}
          {showMinimize && (
            <button
              type="button"
              className="collapsible-minimize"
              onClick={handleMinimize}
              aria-label={`Minimize ${title}`}
              title="Minimize"
            >
              <MinimizeIcon />
            </button>
          )}
        </div>
      )}
    </header>
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
  showMinimize: PropTypes.bool,
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
      <div className="collapsible-content-inner">{children}</div>
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
