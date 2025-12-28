/**
 * @module AnalysisPanel/components/AnalysisComponents
 * @description Consolidated Analysis Panel UI components
 * Includes Badge, Button, Toolbar, and Header components
 */

import PropTypes from "prop-types";

// ============================================================================
// AnalysisBadge Component
// ============================================================================

/**
 * Analysis mode indicator badge
 * @param {Object} props
 * @param {string} props.text - Badge text (default: "Analysis Mode")
 * @param {string} props.className - Additional CSS classes
 */
// ts-prune-ignore-next (used in AnalysisHeader within this file)
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

// ============================================================================
// AnalysisButton Component
// ============================================================================

/**
 * Button component for Analysis Mode
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant: 'default' | 'primary' | 'danger' | 'ghost'
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisButton({
  children,
  variant = "default",
  onClick,
  disabled = false,
  ariaLabel,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`analysis-btn ${variant !== "default" ? `analysis-btn--${variant}` : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

AnalysisButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "primary", "danger", "ghost"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};

// ============================================================================
// AnalysisToolbar Component
// ============================================================================

/**
 * Toolbar for Analysis Mode actions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Toolbar content
 * @param {number} props.selectedCount - Number of selected items
 * @param {React.ReactNode} props.actions - Action buttons
 */
export function AnalysisToolbar({ children, selectedCount = 0, actions }) {
  return (
    <div className="analysis-toolbar">
      {selectedCount > 0 && (
        <div className="analysis-selection-badge">
          <span className="analysis-selection-count">{selectedCount}</span>
          <span className="analysis-selection-label">selected</span>
        </div>
      )}
      {children && <div className="analysis-toolbar-content">{children}</div>}
      {actions && <div className="analysis-toolbar-actions">{actions}</div>}
    </div>
  );
}

AnalysisToolbar.propTypes = {
  children: PropTypes.node,
  selectedCount: PropTypes.number,
  actions: PropTypes.node,
};

// ============================================================================
// AnalysisHeader Component
// ============================================================================

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
interface AnalysisHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  showBadge?: boolean;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  summary?: React.ReactNode;
  icon?: string;
  contentId?: string;
  className?: string;
}

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
}: AnalysisHeaderProps) {
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

