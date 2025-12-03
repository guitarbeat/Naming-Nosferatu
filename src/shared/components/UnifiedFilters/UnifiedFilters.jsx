/**
 * @module UnifiedFilters
 * @description Unified filter controls component for both Tournament and Profile views.
 * Supports different filter sets based on mode.
 */

import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import Select from "../Form/Select";
import { FILTER_OPTIONS } from "../../../core/constants";
import styles from "./UnifiedFilters.module.css";

// * Filter option constants
const TOURNAMENT_SORT_OPTIONS = [
  { value: "alphabetical", label: "A-Z" },
  { value: "rating", label: "Rating" },
  { value: "recent", label: "Recent" },
];

const VISIBILITY_OPTIONS = [
  { value: "all", label: "All Names" },
  { value: "active", label: "Visible Only" },
  { value: "hidden", label: "Hidden Only" },
];

const DEFAULT_USER_OPTIONS = [
  { value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
  { value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
  { value: FILTER_OPTIONS.USER.OTHER, label: "Other Users" },
];

const PROFILE_SORT_OPTIONS = [
  { value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
  { value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
  { value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
  { value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
  { value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
  { value: FILTER_OPTIONS.SORT.CREATED, label: "Created" },
];

const SELECTION_FILTER_OPTIONS = [
  { value: "all", label: "All Names" },
  { value: "selected", label: "Ever Selected" },
  { value: "never_selected", label: "Never Selected" },
  { value: "frequently_selected", label: "Frequently Selected" },
  { value: "recently_selected", label: "Recently Selected" },
];

/**
 * UnifiedFilters Component
 * @param {Object} props
 * @param {string} props.mode - Display mode: 'tournament', 'profile', or 'hybrid'
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Handler for filter changes
 * @param {number} props.filteredCount - Number of filtered results
 * @param {number} props.totalCount - Total number of items
 * @param {Array} props.categories - Available categories (tournament mode)
 * @param {boolean} props.showUserFilter - Show user filter (profile mode, admin only)
 * @param {boolean} props.showSelectionFilter - Show selection filter (profile mode)
 * @param {Array} props.userSelectOptions - Custom user filter options (profile mode)
 * @param {number} props.selectedCount - Number of selected items (tournament mode)
 * @param {boolean} props.showSelectedOnly - Show selected only toggle state
 * @param {Function} props.onToggleShowSelected - Toggle show selected only
 * @param {boolean} props.isSwipeMode - Swipe mode state
 * @param {Function} props.onToggleSwipeMode - Toggle swipe mode
 * @param {boolean} props.showCatPictures - Show cat pictures state
 * @param {Function} props.onToggleCatPictures - Toggle cat pictures
 * @param {boolean} props.analysisMode - Analysis mode state
 * @param {string} props.className - Additional CSS classes
 */
function UnifiedFilters({
  mode = "tournament",
  filters = {},
  onFilterChange,
  filteredCount = 0,
  totalCount = 0,
  categories = [],
  showUserFilter = false,
  showSelectionFilter = false,
  userSelectOptions,
  selectedCount,
  showSelectedOnly,
  onToggleShowSelected,
  isSwipeMode,
  onToggleSwipeMode,
  showCatPictures,
  onToggleCatPictures,
  analysisMode = false,
  className = "",
}) {
  // * Memoized user options
  const userOptions = useMemo(
    () => userSelectOptions || DEFAULT_USER_OPTIONS,
    [userSelectOptions],
  );

  // * Check if categories are available
  const hasCategories = useMemo(
    () => Array.isArray(categories) && categories.length > 0,
    [categories],
  );

  // * Handle filter changes
  const handleChange = useCallback(
    (filterName, value) => {
      if (onFilterChange && typeof onFilterChange === "function") {
        onFilterChange({ ...filters, [filterName]: value });
      }
    },
    [onFilterChange, filters],
  );

  // * Render count display
  const renderCount = useCallback(() => {
    const hasSelection = selectedCount !== undefined && selectedCount !== null;
    const hasFilters = filters.category || filters.searchTerm;

    if (hasSelection) {
      return (
        <>
          <span className={styles.selectionCount}>
            {selectedCount}/{totalCount}
          </span>
          {hasFilters && (
            <span className={styles.filterInfo}>
              {" • "}
              {filteredCount}
              {filters.category && ` • ${filters.category}`}
              {filters.searchTerm && ` • "${filters.searchTerm}"`}
            </span>
          )}
        </>
      );
    }

    return (
      <>
        {filteredCount}/{totalCount}
        {filters.category && ` • ${filters.category}`}
        {filters.searchTerm && ` • "${filters.searchTerm}"`}
      </>
    );
  }, [
    selectedCount,
    totalCount,
    filteredCount,
    filters.category,
    filters.searchTerm,
  ]);

  // * Render action button
  const renderActionButton = useCallback((config) => {
    const { onClick, isActive, activeLabel, inactiveLabel, ariaLabel } = config;
    if (!onClick) return null;

    return (
      <button
        type="button"
        onClick={onClick}
        className={isActive ? styles.unifiedButtonActive : styles.unifiedButton}
        aria-label={ariaLabel}
      >
        {isActive ? activeLabel : inactiveLabel}
      </button>
    );
  }, []);

  // * Action buttons configuration
  const actionButtons = useMemo(() => {
    if (!onToggleSwipeMode && !onToggleCatPictures) {
      return [];
    }

    return [
      {
        onClick: onToggleSwipeMode,
        isActive: isSwipeMode,
        activeLabel: "Cards",
        inactiveLabel: "Swipe",
        ariaLabel: isSwipeMode ? "Switch to card mode" : "Switch to swipe mode",
        condition: true,
        key: "swipe",
      },
      {
        onClick: onToggleCatPictures,
        isActive: showCatPictures,
        activeLabel: "Hide",
        inactiveLabel: "Cats",
        ariaLabel: showCatPictures ? "Hide cat pictures" : "Show cat pictures",
        condition: true,
        key: "cats",
      },
    ].filter((btn) => btn.onClick && btn.condition);
  }, [
    onToggleSwipeMode,
    onToggleCatPictures,
    isSwipeMode,
    showCatPictures,
  ]);

  // * Render action buttons group
  const renderActions = useCallback(() => {
    if (actionButtons.length === 0) return null;

    return (
      <div className={styles.unifiedActions}>
        {actionButtons.map((btn) => (
          <React.Fragment key={btn.key}>
            {renderActionButton(btn)}
          </React.Fragment>
        ))}
      </div>
    );
  }, [actionButtons, renderActionButton]);

  // * Render select dropdown
  const renderSelect = useCallback((config) => {
    const {
      value,
      onChange,
      options,
      className: selectClassName,
      ariaLabel,
      placeholder = "All",
    } = config;

    return (
      <select
        value={value || ""}
        onChange={(e) => {
          const newValue = e.target.value || null;
          onChange(newValue);
        }}
        className={selectClassName}
        aria-label={ariaLabel}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    );
  }, []);

  // * Render filter group (profile/hybrid mode)
  const renderFilterGroup = useCallback((config) => {
    const {
      id,
      label,
      value,
      onChange,
      options,
      className: groupClassName,
    } = config;
    if (!options || options.length === 0) return null;

    return (
      <div className={styles.filterGroup}>
        <label htmlFor={id} className={styles.filterLabel}>
          {label}
        </label>
        <Select
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={options}
          className={groupClassName || styles.filterSelect}
        />
      </div>
    );
  }, []);

  // * Render results count (profile/hybrid mode)
  const renderResultsCount = useCallback(
    () => (
      <div className={styles.resultsCount}>
        <span className={styles.count}>{filteredCount}</span>
        {filteredCount !== totalCount && (
          <>
            <span className={styles.separator}>/</span>
            <span className={styles.total}>{totalCount}</span>
            <span className={styles.badge}>filtered</span>
          </>
        )}
        {filteredCount === totalCount && (
          <span className={`${styles.badge} ${styles.badgeTotal}`}>total</span>
        )}
      </div>
    ),
    [filteredCount, totalCount],
  );

  // * Render sort controls (profile/hybrid mode)
  const renderSortControls = useCallback(
    () => (
      <div className={styles.filterRow}>
        <div className={styles.sortGroup}>
          <label htmlFor="filter-sort" className={styles.filterLabel}>
            Sort By
          </label>
          <div className={styles.sortControls}>
            <Select
              id="filter-sort"
              name="filter-sort"
              value={filters.sortBy || FILTER_OPTIONS.SORT.RATING}
              onChange={(e) => handleChange("sortBy", e.target.value)}
              options={PROFILE_SORT_OPTIONS}
              className={styles.filterSelect}
            />
            <button
              type="button"
              onClick={() =>
                handleChange(
                  "sortOrder",
                  filters.sortOrder === FILTER_OPTIONS.ORDER.ASC
                    ? FILTER_OPTIONS.ORDER.DESC
                    : FILTER_OPTIONS.ORDER.ASC,
                )
              }
              className={styles.sortOrderButton}
              title={`Sort ${filters.sortOrder === FILTER_OPTIONS.ORDER.ASC ? "Descending" : "Ascending"}`}
              aria-label={`Toggle sort order to ${filters.sortOrder === FILTER_OPTIONS.ORDER.ASC ? "descending" : "ascending"}`}
            >
              {filters.sortOrder === FILTER_OPTIONS.ORDER.ASC ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>
    ),
    [filters.sortBy, filters.sortOrder, handleChange],
  );

  // * Render profile filter groups (shared between profile and hybrid modes)
  const renderProfileFilters = useCallback(
    () => (
      <div className={styles.filterRow}>
        {renderFilterGroup({
          id: "filter-status",
          label: "Status",
          value: filters.filterStatus || "all",
          onChange: (value) => handleChange("filterStatus", value),
          options: VISIBILITY_OPTIONS,
        })}

        {showUserFilter &&
          renderFilterGroup({
            id: "filter-user",
            label: "User",
            value: filters.userFilter || FILTER_OPTIONS.USER.ALL,
            onChange: (value) => handleChange("userFilter", value),
            options: userOptions,
          })}

        {showSelectionFilter &&
          renderFilterGroup({
            id: "filter-selection",
            label: "Selection",
            value: filters.selectionFilter || "all",
            onChange: (value) => handleChange("selectionFilter", value),
            options: SELECTION_FILTER_OPTIONS,
          })}
      </div>
    ),
    [
      filters.filterStatus,
      filters.userFilter,
      filters.selectionFilter,
      showUserFilter,
      showSelectionFilter,
      userOptions,
      handleChange,
      renderFilterGroup,
    ],
  );

  // * Tournament mode: minimal - only swipe and cats buttons
  if (mode === "tournament") {
    return (
      <div
        className={`${styles.unifiedBar} ${className}`}
        data-component="unified-filters"
        data-mode="tournament"
        aria-label="Display options"
      >
        <div
          className={styles.unifiedContainer}
          data-element="filter-container"
        >
          {/* Action buttons only */}
          {renderActions()}
        </div>
      </div>
    );
  }

  // * Hybrid mode: tournament + profile filters
  if (mode === "hybrid") {
    return (
      <div className={`${styles.filtersContainer} ${className}`}>
        {renderResultsCount()}

        {/* Tournament filters */}
        <div className={styles.filterRow}>
          <div className={styles.searchBar}>
            <input
              type="text"
              value={filters.searchTerm || ""}
              onChange={(e) => handleChange("searchTerm", e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
              aria-label="Search cat names"
            />
          </div>
          {hasCategories &&
            renderFilterGroup({
              id: "filter-category",
              label: "Category",
              value: filters.category || "",
              onChange: (value) => handleChange("category", value || null),
              options: categories.map((cat) => ({ value: cat, label: cat })),
            })}
        </div>

        {/* Profile filters */}
        <div className={styles.filtersGrid}>
          {renderProfileFilters()}
          {renderSortControls()}
        </div>
      </div>
    );
  }

  // * Profile mode: full filter panel
  return (
    <div className={`${styles.filtersContainer} ${className}`}>
      {renderResultsCount()}

      <div className={styles.filtersGrid}>
        {renderProfileFilters()}
        {renderSortControls()}
      </div>
    </div>
  );
}

UnifiedFilters.propTypes = {
  mode: PropTypes.oneOf(["tournament", "profile", "hybrid"]),
  filters: PropTypes.shape({
    searchTerm: PropTypes.string,
    category: PropTypes.string,
    sortBy: PropTypes.string,
    filterStatus: PropTypes.string,
    userFilter: PropTypes.string,
    selectionFilter: PropTypes.string,
    sortOrder: PropTypes.string,
  }),
  onFilterChange: PropTypes.func.isRequired,
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  categories: PropTypes.arrayOf(PropTypes.string),
  showUserFilter: PropTypes.bool,
  showSelectionFilter: PropTypes.bool,
  userSelectOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  selectedCount: PropTypes.number,
  showSelectedOnly: PropTypes.bool,
  onToggleShowSelected: PropTypes.func,
  isSwipeMode: PropTypes.bool,
  onToggleSwipeMode: PropTypes.func,
  showCatPictures: PropTypes.bool,
  onToggleCatPictures: PropTypes.func,
  analysisMode: PropTypes.bool,
  className: PropTypes.string,
};

// * Memoize component to prevent unnecessary re-renders
const MemoizedUnifiedFilters = React.memo(UnifiedFilters);
export { MemoizedUnifiedFilters as UnifiedFilters };
