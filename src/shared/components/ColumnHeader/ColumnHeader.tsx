/**
 * @module ColumnHeader
 * @description Reusable table column header with optional sorting and metric explanation
 */

import React from "react";
import PropTypes from "prop-types";
import "./ColumnHeader.css";

/**
 * InfoIcon Component - Commonly used trigger for MetricExplainer
 */
function InfoIcon() {
  return (
    <span
      className="info-icon"
      aria-hidden="true"
      title="Click for more information"
    >
      ⓘ
    </span>
  );
}

/**
 * MetricExplainer Component
 * Shows detailed explanation of a metric in a popover
 */
function MetricExplainer({
  metricName,
  value = null,
  children,
  placement = "top",
  onClose,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  // Use metricName to determine if we have a definition
  const hasDefinition = metricName && typeof metricName === "string";

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Close popover when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        popoverRef.current &&
        triggerRef.current &&
        target &&
        !popoverRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [handleClose, isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  if (!hasDefinition) {
    return children;
  }

  const label = metricName; // Use metricName as the label

  return (
    <div className="metric-explainer">
      <div
        ref={triggerRef}
        className="metric-explainer-trigger"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`Show explanation for ${label}`}
        title={`Learn about ${label}`}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`metric-explainer-popover metric-explainer-popover-${placement}`}
          role="tooltip"
          aria-hidden="false"
        >
          <div className="metric-explainer-content">
            <div className="metric-explainer-header">
              <h3 className="metric-explainer-title">{label}</h3>
              {value !== null && (
                <span className="metric-explainer-value-label">
                  Current value: {value}
                </span>
              )}
            </div>
            <p className="metric-explainer-description">
              This metric shows performance data for {label}.
            </p>
            <button
              className="metric-explainer-close"
              onClick={handleClose}
              aria-label="Close explanation"
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="metric-explainer-arrow" />
        </div>
      )}
    </div>
  );
}

/**
 * ColumnHeader Component
 * Renders a sortable table header with optional metric explanation
 *
 * @param {Object} props
 * @param {string} props.label - Header label text
 * @param {string} props.metricName - Name of the metric (for explanation)
 * @param {boolean} props.sortable - Whether this column is sortable
 * @param {boolean} props.sorted - Whether this column is currently sorted
 * @param {string} props.sortDirection - Current sort direction: 'asc' or 'desc'
 * @param {Function} props.onSort - Callback when sort is clicked: (field, direction) => void
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ColumnHeader({
  label,
  metricName,
  sortable = true,
  sorted = false,
  sortDirection = "desc",
  onSort,
  className = "",
}) {
  const handleSort = () => {
    if (!sortable || !onSort) return;

    // Toggle direction if already sorted by this column
    const newDirection = sorted && sortDirection === "desc" ? "asc" : "desc";
    onSort(metricName, newDirection);
  };

  const headerClass = `
    column-header
    ${sortable ? "column-header-sortable" : ""}
    ${sorted ? "column-header-sorted" : ""}
    ${className}
  `.trim();

  const content = (
    <div className={headerClass}>
      <div className="column-header-label">
        <span className="column-header-text">{label}</span>

        {/* Sort indicator */}
        {sortable && sorted && (
          <span className="column-header-sort-indicator" aria-hidden="true">
            {sortDirection === "desc" ? "▼" : "▲"}
          </span>
        )}
      </div>

      {/* Metric explanation icon */}
      {metricName && (
        <MetricExplainer metricName={metricName} placement="bottom" onClose={() => {}}>
          <InfoIcon />
        </MetricExplainer>
      )}
    </div>
  );

  if (!sortable) {
    return content;
  }

  return (
    <button
      className={`${headerClass} column-header-button`}
      onClick={handleSort}
      aria-sort={
        sorted ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
      }
      type="button"
    >
      {content}
    </button>
  );
}

ColumnHeader.propTypes = {
  label: PropTypes.string.isRequired,
  metricName: PropTypes.string,
  sortable: PropTypes.bool,
  sorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf(["asc", "desc"]),
  onSort: PropTypes.func,
  className: PropTypes.string,
};

ColumnHeader.displayName = "ColumnHeader";
