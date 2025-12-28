/**
 * @module TournamentToolbar/ToolbarComponents
 * @description Consolidated tournament toolbar components
 * Includes small reusable components and FilterModeToolbar
 */

import { useMemo } from "react";
import PropTypes from "prop-types";
import LiquidGlass from "../LiquidGlass/LiquidGlass";
import { Select } from "../Form/Form";
import { FILTER_OPTIONS } from "../../../core/constants";
import { TOOLBAR_GLASS_CONFIGS, FILTER_CONFIGS, styles } from "./config";

// ============================================================================
// BinaryToggle Component
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
// SortOrderIcon Component
// ============================================================================

interface SortOrderIconProps {
  direction?: "asc" | "desc";
  className?: string;
}

// ts-prune-ignore-next (used in FilterModeToolbar within this file)
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
// FilterSelect Component
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

// ts-prune-ignore-next (used in FilterModeToolbar within this file)
export function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className={styles.filterGroup}>
      <label htmlFor={id} className={styles.filterLabel}>
        {label}
      </label>
      <Select
        name={id}
        value={value || ""}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null)}
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
// ToolbarGlass Component
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

// ============================================================================
// FilterModeToolbar Component
// ============================================================================

interface TournamentFilters {
  searchTerm?: string;
  category?: string;
  sortBy?: string;
  filterStatus?: string;
  userFilter?: string;
  selectionFilter?: string;
  sortOrder?: string;
  dateFilter?: string;
}

interface FilterModeToolbarProps {
  filters: TournamentFilters;
  onFilterChange?: (name: string, value: string) => void;
  filteredCount: number;
  totalCount: number;
  categories: string[];
  showUserFilter: boolean;
  userOptions?: { value: string; label: string }[] | null;
  showSelectionFilter: boolean;
  analysisMode: boolean;
  isHybrid: boolean;
  showFilters: boolean;
}

// ts-prune-ignore-next (used in TournamentToolbar)
export function FilterModeToolbar({
  filters,
  onFilterChange,
  filteredCount,
  totalCount,
  categories,
  showUserFilter,
  userOptions = null,
  showSelectionFilter,
  analysisMode,
  isHybrid,
  showFilters,
}: FilterModeToolbarProps) {
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat,
        label: cat,
      })),
    [categories],
  );

  const isAsc = filters.sortOrder === FILTER_OPTIONS.ORDER.ASC;

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.resultsCount}>
        <span className={styles.count}>{filteredCount.toLocaleString()}</span>
        {filteredCount !== totalCount && (
          <>
            <span className={styles.separator}>/</span>
            <span className={styles.total}>{totalCount.toLocaleString()}</span>
            <span className={styles.badge}>filtered</span>
          </>
        )}
        {filteredCount === totalCount && (
          <span className={`${styles.badge} ${styles.badgeTotal}`}>total</span>
        )}
      </div>

      {isHybrid && categories.length > 0 && (
        <div className={styles.filterRow}>
          <FilterSelect
            id="filter-category"
            label="Category"
            value={filters.category || null}
            options={categoryOptions}
            onChange={(value) => onFilterChange?.("category", value as string)}
          />
        </div>
      )}

      {showFilters && (
        <div className={styles.filtersGrid}>
          <div className={styles.filterRow}>
            <FilterSelect
              id="filter-status"
              label="Status"
              value={(filters.filterStatus as string) || FILTER_OPTIONS.VISIBILITY.VISIBLE}
              options={FILTER_CONFIGS.visibility}
              onChange={(value) =>
                onFilterChange?.(
                  "filterStatus",
                  (value === "active"
                    ? FILTER_OPTIONS.VISIBILITY.VISIBLE
                    : value || FILTER_OPTIONS.VISIBILITY.VISIBLE) as string,
                )
              }
            />
            {showUserFilter && (
              <FilterSelect
                id="filter-user"
                label="User"
                value={(filters.userFilter as string) || FILTER_OPTIONS.USER.ALL}
                options={userOptions || FILTER_CONFIGS.users}
                onChange={(value) => onFilterChange?.("userFilter", value as string)}
              />
            )}
            {showSelectionFilter && (
              <FilterSelect
                id="filter-selection"
                label="Selection"
                value={(filters.selectionFilter as string) || "all"}
                options={FILTER_CONFIGS.selection}
                onChange={(value) => onFilterChange?.("selectionFilter", value as string)}
              />
            )}
            {analysisMode && (
              <FilterSelect
                id="filter-date"
                label="Date"
                value={(filters.dateFilter as string) || "all"}
                options={FILTER_CONFIGS.date}
                onChange={(value) => onFilterChange?.("dateFilter", value as string)}
              />
            )}
          </div>
          <div className={styles.filterRow}>
            <div className={styles.sortGroup}>
              <label htmlFor="filter-sort" className={styles.filterLabel}>
                Sort By
              </label>
              <div className={styles.sortControls}>
                <Select
                  name="filter-sort"
                  value={(filters.sortBy as string | number | null | undefined) || FILTER_OPTIONS.SORT.RATING}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange?.("sortBy", e.target.value)}
                  options={FILTER_CONFIGS.sort}
                  className={styles.filterSelect}
                />
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange?.(
                      "sortOrder",
                      (isAsc
                        ? FILTER_OPTIONS.ORDER.DESC
                        : FILTER_OPTIONS.ORDER.ASC) as string,
                    )
                  }
                  className={styles.sortOrderButton}
                  title={`Sort ${isAsc ? "Descending" : "Ascending"}`}
                  aria-label={`Toggle sort order to ${isAsc ? "descending" : "ascending"}`}
                >
                  <SortOrderIcon
                    direction={isAsc ? "asc" : "desc"}
                    className={styles.sortIcon}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

FilterModeToolbar.propTypes = {
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  categories: PropTypes.arrayOf(PropTypes.string),
  showUserFilter: PropTypes.bool,
  userOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  showSelectionFilter: PropTypes.bool,
  analysisMode: PropTypes.bool,
  isHybrid: PropTypes.bool,
  showFilters: PropTypes.bool,
};

