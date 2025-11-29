/**
 * @module AnalysisPanel
 * @description Unified container component for Analysis Mode.
 * Provides a cohesive visual wrapper with consistent styling and layout.
 */

import PropTypes from "prop-types";
import { formatShortcut, getModifierKey } from "../../utils/platformUtils";
import "../../styles/analysis-mode.css";

/**
 * Analysis mode indicator badge
 */
function AnalysisBadge() {
  return (
    <span className="analysis-badge" role="status" aria-live="polite">
      Analysis Mode
    </span>
  );
}

/**
 * Analysis panel header with mode indicator
 */
function AnalysisHeader({ title, actions }) {
  return (
    <header className="analysis-header">
      <div className="analysis-header-content">
        <AnalysisBadge />
        {title && <h2 className="analysis-title">{title}</h2>}
      </div>
      {actions && <div className="analysis-header-actions">{actions}</div>}
    </header>
  );
}

AnalysisHeader.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node,
};

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

/**
 * Stats display for Analysis Mode
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects { value, label, accent? }
 */
export function AnalysisStats({ stats }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="analysis-stats">
      {stats.map((stat, index) => (
        <div
          key={stat.label || index}
          className={`analysis-stat ${stat.accent ? "analysis-stat--accent" : ""}`}
        >
          <span className="analysis-stat-value">{stat.value}</span>
          <span className="analysis-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

AnalysisStats.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
      accent: PropTypes.bool,
    }),
  ).isRequired,
};

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
        <>
          <div className="analysis-selection">
            <span className="analysis-selection-count">{selectedCount}</span>
            <span className="analysis-selection-label">selected</span>
          </div>
          <div className="analysis-toolbar-divider" />
        </>
      )}
      {children}
      {actions && (
        <>
          <div style={{ flex: 1 }} />
          <div className="analysis-toolbar-group">{actions}</div>
        </>
      )}
    </div>
  );
}

AnalysisToolbar.propTypes = {
  children: PropTypes.node,
  selectedCount: PropTypes.number,
  actions: PropTypes.node,
};

/**
 * Button component for Analysis Mode
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant: 'default' | 'primary' | 'danger' | 'ghost'
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.ariaLabel - Accessibility label
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
  const variantClass = variant !== "default" ? `analysis-btn--${variant}` : "";

  return (
    <button
      type="button"
      className={`analysis-btn ${variantClass} ${className}`}
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

/**
 * Search icon SVG component
 */
function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/**
 * Search input with icon
 * @param {Object} props
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 */
export function AnalysisSearch({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="analysis-search analysis-filter">
      <span className="analysis-search-icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="analysis-input analysis-search-input"
        aria-label="Search"
      />
    </div>
  );
}

AnalysisSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

/**
 * Highlights section for top items
 * @param {Object} props
 * @param {Array} props.highlights - Array of highlight groups
 */
export function AnalysisHighlights({ highlights }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="analysis-highlights">
      {highlights.map((group) => (
        <div key={group.title} className="analysis-highlight">
          <h3 className="analysis-highlight-title">{group.title}</h3>
          <ul className="analysis-highlight-list">
            {group.items.slice(0, 5).map((item) => (
              <li key={item.id} className="analysis-highlight-item">
                <span className="analysis-highlight-name">{item.name}</span>
                <span className="analysis-highlight-value">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

AnalysisHighlights.propTypes = {
  highlights: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          name: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        }),
      ).isRequired,
    }),
  ),
};

/**
 * Progress indicator
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {number} props.max - Maximum value
 * @param {string} props.label - Optional label
 */
export function AnalysisProgress({ value, max, label }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="analysis-progress">
      <div
        className="analysis-progress-bar"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
      >
        <div
          className="analysis-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="analysis-progress-text">
        {label || `${value}/${max}`}
      </span>
    </div>
  );
}

AnalysisProgress.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  label: PropTypes.string,
};

/**
 * Toggle button for Analysis Mode (sidebar)
 * @param {Object} props
 * @param {boolean} props.active - Whether Analysis Mode is active
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 */
export function AnalysisToggle({ active, onClick, collapsed = false }) {
  const shortcutKey = formatShortcut("A", { ctrl: true, shift: true });

  return (
    <button
      type="button"
      className={`analysis-toggle ${active ? "analysis-toggle--active" : ""}`}
      onClick={onClick}
      aria-label={active ? "Exit Analysis Mode" : "Enter Analysis Mode"}
      aria-pressed={active}
      title={`${active ? "Exit" : "Enter"} Analysis Mode (${shortcutKey})`}
    >
      <span className="analysis-toggle-indicator" />
      {!collapsed && (
        <>
          <span className="analysis-toggle-label">
            {active ? "Analysis" : "Analyze"}
          </span>
          <span className="analysis-toggle-shortcut" aria-hidden="true">
            {shortcutKey}
          </span>
        </>
      )}
    </button>
  );
}

AnalysisToggle.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
};

/**
 * Analysis Mode Banner - Visual indicator when Analysis Mode is active
 * @param {Object} props
 * @param {Function} props.onClose - Close handler (optional)
 * @param {boolean} props.showShortcut - Whether to show keyboard shortcut hint
 */
export function AnalysisModeBanner({ onClose, showShortcut = true }) {
  const shortcutDisplay = `${getModifierKey()} + Shift + A`;

  return (
    <div
      className="analysis-mode-banner"
      role="banner"
      aria-label="Analysis Mode Active"
    >
      <div className="analysis-mode-banner-content">
        <AnalysisBadge />
        <span className="analysis-mode-banner-text">Analysis Mode Active</span>
        {showShortcut && (
          <span className="analysis-mode-banner-shortcut">
            {shortcutDisplay}
          </span>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="analysis-mode-banner-close"
          onClick={onClose}
          aria-label="Dismiss Analysis Mode banner"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

AnalysisModeBanner.propTypes = {
  onClose: PropTypes.func,
  showShortcut: PropTypes.bool,
};

export default AnalysisPanel;
