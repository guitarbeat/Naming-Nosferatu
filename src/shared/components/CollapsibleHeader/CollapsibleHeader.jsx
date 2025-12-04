/**
 * @module CollapsibleHeader
 * @description Simple, reusable collapsible header component.
 * KISS principle: minimal props, clear structure, consistent behavior.
 */

import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
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
 * Restore/Expand icon component for minimized state
 */
const RestoreIcon = () => (
  <svg
    className="collapsible-restore-icon"
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

/**
 * Hamburger dots component for FAB menu
 */
const HamburgerDots = () => (
  <div className="collapsible-hamburger-dots">
    <span className="collapsible-dot collapsible-dot-first" />
    <span className="collapsible-dot collapsible-dot-second" />
    <span className="collapsible-dot collapsible-dot-third" />
  </div>
);

HamburgerDots.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
};

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
 * @param {React.ReactNode} props.toolbar - Optional toolbar to show below header when expanded
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
  toolbar,
  quickActions, // * Optional quick actions for FAB menu when minimized
}) {
  const [fabExpanded, setFabExpanded] = useState(false);
  const hasQuickActions =
    isCollapsed && quickActions && quickActions.length > 0;

  // * Reset FAB state when panel is expanded
  // * Use a key-based reset pattern to avoid setState in effect
  const prevCollapsedRef = useRef(isCollapsed);
  useEffect(() => {
    const wasCollapsed = prevCollapsedRef.current;
    if (wasCollapsed && !isCollapsed) {
      // Panel was expanded - reset FAB
      // This is a valid use case: synchronizing FAB state with collapsed state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFabExpanded(false);
    }
    prevCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  const handleMinimize = (e) => {
    e.stopPropagation();
    if (!isCollapsed) {
      onToggle();
    }
  };

  const handleFabToggle = (e) => {
    e.stopPropagation();
    if (hasQuickActions) {
      setFabExpanded(!fabExpanded);
    } else {
      onToggle();
    }
  };

  const handleFabAction = (action, e) => {
    e.stopPropagation();
    if (action.onClick) {
      action.onClick(e);
    }
    setFabExpanded(false);
  };

  // * Close FAB when clicking outside
  useEffect(() => {
    if (fabExpanded) {
      const handleOutsideClick = (e) => {
        const { target } = e;
        const fabWrapper = target.closest(".collapsible-fab-wrapper");
        const header = target.closest(".collapsible-header--collapsed");
        const actionBar = target.closest(".collapsible-fab-action-bar");

        if (!fabWrapper && !header && !actionBar) {
          setFabExpanded(false);
        }
      };
      // * Use capture phase to catch clicks before they bubble
      document.addEventListener("click", handleOutsideClick, true);
      return () =>
        document.removeEventListener("click", handleOutsideClick, true);
    }
  }, [fabExpanded]);

  return (
    <>
      <div
        className={`collapsible-fab-wrapper ${hasQuickActions ? "collapsible-fab-wrapper--active" : ""}`}
      >
        {/* FAB Action Bar - expands horizontally when FAB is clicked */}
        {hasQuickActions && (
          <div
            className={`collapsible-fab-action-bar ${fabExpanded ? "collapsible-fab-action-bar--expanded" : ""}`}
          >
            <div className="collapsible-fab-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  className={`collapsible-fab-action-item collapsible-fab-action-${index + 1}`}
                  onClick={(e) => handleFabAction(action, e)}
                  aria-label={action.label || action.title}
                  title={action.title || action.label}
                >
                  {action.icon || action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <header
          className={`collapsible-header collapsible-header--${variant} ${isCollapsed ? "collapsible-header--collapsed" : ""} ${hasQuickActions ? "collapsible-header--fab-enabled" : ""} ${fabExpanded ? "collapsible-header--fab-expanded" : ""} ${className}`}
        >
          <button
            type="button"
            className="collapsible-toggle"
            onClick={hasQuickActions ? handleFabToggle : onToggle}
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
            title={isCollapsed ? title : undefined}
          >
            {isCollapsed ? (
              /* Minimized circular state - show hamburger dots or icon */
              hasQuickActions ? (
                <HamburgerDots isExpanded={fabExpanded} />
              ) : (
                <>
                  <ChevronIcon isCollapsed={isCollapsed} />
                  {icon && (
                    <span
                      className="collapsible-icon-collapsed"
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                  )}
                </>
              )
            ) : (
              /* Expanded state - show chevron, icon and title */
              <>
                <ChevronIcon isCollapsed={isCollapsed} />
                {icon && (
                  <span className="collapsible-icon" aria-hidden="true">
                    {icon}
                  </span>
                )}
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
          {/* Restore button - only shown when no quickActions (FAB menu handles restore when quickActions exist) */}
          {isCollapsed && showMinimize && !hasQuickActions && (
            <button
              type="button"
              className="collapsible-restore"
              onClick={onToggle}
              aria-label={`Restore ${title}`}
              title={`Restore ${title}`}
            >
              <RestoreIcon />
            </button>
          )}
        </header>
      </div>
      {!isCollapsed && toolbar && (
        <div className="collapsible-header-toolbar">{toolbar}</div>
      )}
    </>
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
  toolbar: PropTypes.node,
  quickActions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      label: PropTypes.string,
      title: PropTypes.string,
      onClick: PropTypes.func.isRequired,
    }),
  ),
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
