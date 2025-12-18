/**
 * @module TournamentToolbar/components
 * @description Small reusable components for the tournament toolbar
 */

import PropTypes from "prop-types";
import LiquidGlass from "../LiquidGlass";
import { Select } from "../Form";
import { TOOLBAR_GLASS_CONFIGS } from "./toolbarConstants";
import { styles } from "./styles";

// ============================================================================
// BinaryToggle - Toggle switch component
// ============================================================================

interface BinaryToggleProps {
  isActive: boolean;
  onClick: () => void;
  activeLabel: string;
  inactiveLabel: string;
  ariaLabel: string;
}

export function BinaryToggle({
  isActive,
  onClick,
  activeLabel,
  inactiveLabel,
  ariaLabel,
}: BinaryToggleProps) {
  return (
    <div className={styles.toggleWrapper}>
      <button
        type="button"
        onClick={onClick}
        className={`${styles.toggleSwitch} ${
          isActive ? styles.toggleSwitchActive : ""
        }`}
        aria-label={ariaLabel}
        aria-pressed={isActive}
        role="switch"
      >
        <span className={styles.toggleLabel} data-position="left">
          {inactiveLabel}
        </span>
        <span className={styles.toggleThumb} data-active={isActive} />
        <span className={styles.toggleLabel} data-position="right">
          {activeLabel}
        </span>
      </button>
    </div>
  );
}

BinaryToggle.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  activeLabel: PropTypes.string.isRequired,
  inactiveLabel: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

// ============================================================================
// SortOrderIcon - SVG icon for sort direction
// ============================================================================

interface SortOrderIconProps {
  direction?: "asc" | "desc";
  className?: string;
}

export function SortOrderIcon({ direction = "asc", className = "" }: SortOrderIconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {direction === "asc" ? (
        <path
          d="M8 4L4 8H7V12H9V8H12L8 4Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8 12L12 8H9V4H7V8H4L8 12Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

SortOrderIcon.propTypes = {
  direction: PropTypes.oneOf(["asc", "desc"]).isRequired,
  className: PropTypes.string,
};

// ============================================================================
// FilterSelect - Select dropdown for filters
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
}

export function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className={styles.filterGroup}>
      <label htmlFor={id} className={styles.filterLabel}>
        {label}
      </label>
      <Select
        id={id}
        name={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        options={options}
        className={styles.filterSelect}
      />
    </div>
  );
}

FilterSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

// ============================================================================
// ToolbarGlass - LiquidGlass wrapper with mode-specific configs
// ============================================================================

interface ToolbarGlassProps {
  mode: "tournament" | "filter";
  id: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function ToolbarGlass({ mode, id, className, style, children }: ToolbarGlassProps) {
  const config = TOOLBAR_GLASS_CONFIGS[mode] || TOOLBAR_GLASS_CONFIGS.filter;

  return (
    <LiquidGlass
      id={id}
      width={config.width}
      height={config.height}
      radius={config.radius}
      scale={config.scale}
      saturation={config.saturation}
      frost={config.frost}
      inputBlur={config.inputBlur}
      outputBlur={config.outputBlur}
      className={className}
      style={{ width: "100%", height: "auto", ...style }}
    >
      {children}
    </LiquidGlass>
  );
}

ToolbarGlass.propTypes = {
  mode: PropTypes.oneOf(["tournament", "filter"]).isRequired,
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};
