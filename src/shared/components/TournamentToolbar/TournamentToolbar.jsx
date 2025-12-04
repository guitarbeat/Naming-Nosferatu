/**
 * @module TournamentToolbar
 * @description Toolbar component for Tournament and Profile views with filters and controls.
 * Supports different filter sets based on mode.
 */

import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import Select from "../Form/Select";
import { FILTER_OPTIONS } from "../../../core/constants";
import styles from "./TournamentToolbar.module.css";

// * Filter option constants
const FILTER_CONFIGS = {
  visibility: [
    { value: "all", label: "All Names" },
    { value: "visible", label: "Visible Only" },
    { value: "hidden", label: "Hidden Only" },
  ],
  users: [
    { value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
    { value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
    { value: FILTER_OPTIONS.USER.OTHER, label: "Other Users" },
  ],
  sort: [
    { value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
    { value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
    { value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
    { value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
    { value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
    { value: FILTER_OPTIONS.SORT.CREATED, label: "Created" },
  ],
  selection: [
    { value: "all", label: "All Names" },
    { value: "selected", label: "Ever Selected" },
    { value: "never_selected", label: "Never Selected" },
    { value: "frequently_selected", label: "Frequently Selected" },
    { value: "recently_selected", label: "Recently Selected" },
  ],
};

/**
 * TournamentToolbar Component
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
 * @param {Object} props.startTournamentButton - Start tournament button config {onClick, selectedCount}
 * @param {string} props.className - Additional CSS classes
 */
function TournamentToolbar({
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
  showSelectedOnly: _showSelectedOnly,
  onToggleShowSelected: _onToggleShowSelected,
  isSwipeMode,
  onToggleSwipeMode,
  showCatPictures,
  onToggleCatPictures,
  analysisMode: _analysisMode = false,
  startTournamentButton,
  className = "",
}) {
  // * Memoized options and handlers
  const userOptions = useMemo(
    () => userSelectOptions || FILTER_CONFIGS.users,
    [userSelectOptions]
  );

  const hasCategories = useMemo(
    () => Array.isArray(categories) && categories.length > 0,
    [categories]
  );

  const handleChange = useCallback(
    (filterName, value) => {
      onFilterChange?.({ ...filters, [filterName]: value });
    },
    [onFilterChange, filters]
  );



  // * Render toggle switch
  const renderToggleSwitch = useCallback(
    ({ onClick, isActive, activeLabel, inactiveLabel, ariaLabel, key }) => {
      if (!onClick) return null;

      return (
        <div className={styles.toggleWrapper} key={key}>
          <button
            type="button"
            id={`toggle-${key}`}
            onClick={onClick}
            className={`${styles.toggleSwitch} ${isActive ? styles.toggleSwitchActive : ""}`}
            aria-label={ariaLabel}
            aria-pressed={isActive}
            role="switch"
          >
            <span className={styles.toggleTrack}>
              <span className={styles.toggleThumb}>
                <span className={styles.toggleLabelInside}>
                  {isActive ? activeLabel : inactiveLabel}
                </span>
              </span>
            </span>
          </button>
        </div>
      );
    },
    []
  );

  // * Toggle configurations
  const actionButtons = useMemo(
    () =>
      [
        onToggleSwipeMode && {
          onClick: onToggleSwipeMode,
          isActive: isSwipeMode,
          activeLabel: "Tap",
          inactiveLabel: "Swipe",
          ariaLabel: isSwipeMode
            ? "Switch to swipe mode"
            : "Switch to tap mode",
          key: "swipe",
        },
        onToggleCatPictures && {
          onClick: onToggleCatPictures,
          isActive: showCatPictures,
          activeLabel: "Cats",
          inactiveLabel: "Names",
          ariaLabel: showCatPictures
            ? "Hide cat pictures"
            : "Show cat pictures",
          key: "cats",
        },
      ].filter(Boolean),
    [onToggleSwipeMode, onToggleCatPictures, isSwipeMode, showCatPictures]
  );

  // * Render toggle switches group
  const renderActions = useCallback(
    () =>
      actionButtons.length > 0 && (
        <div className={styles.unifiedActions}>
          {actionButtons.map(renderToggleSwitch)}
        </div>
      ),
    [actionButtons, renderToggleSwitch]
  );



  // * Render search input
  const renderSearchInput = useCallback(
    () => (
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
    ),
    [filters.searchTerm, handleChange]
  );

  // * Render filter group (profile/hybrid mode)
  const renderFilterGroup = useCallback(
    ({ id, label, value, onChange, options, className: groupClassName }) =>
      options?.length > 0 && (
        <div className={styles.filterGroup} key={id}>
          <label htmlFor={id} className={styles.filterLabel}>
            {label}
          </label>
          <Select
            id={id}
            name={id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            options={options}
            className={groupClassName || styles.filterSelect}
          />
        </div>
      ),
    []
  );

  // * Render results count (profile/hybrid mode)
  const renderResultsCount = useCallback(() => {
    const isFiltered = filteredCount !== totalCount;
    return (
      <div className={styles.resultsCount}>
        <span className={styles.count}>{filteredCount}</span>
        {isFiltered ? (
          <>
            <span className={styles.separator}>/</span>
            <span className={styles.total}>{totalCount}</span>
            <span className={styles.badge}>filtered</span>
          </>
        ) : (
          <span className={`${styles.badge} ${styles.badgeTotal}`}>total</span>
        )}
      </div>
    );
  }, [filteredCount, totalCount]);

  // * Render sort controls (profile/hybrid mode)
  const renderSortControls = useCallback(() => {
    const isAsc = filters.sortOrder === FILTER_OPTIONS.ORDER.ASC;
    return (
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
              options={FILTER_CONFIGS.sort}
              className={styles.filterSelect}
            />
            <button
              type="button"
              onClick={() =>
                handleChange(
                  "sortOrder",
                  isAsc ? FILTER_OPTIONS.ORDER.DESC : FILTER_OPTIONS.ORDER.ASC
                )
              }
              className={styles.sortOrderButton}
              title={`Sort ${isAsc ? "Descending" : "Ascending"}`}
              aria-label={`Toggle sort order to ${isAsc ? "descending" : "ascending"}`}
            >
              {isAsc ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>
    );
  }, [filters.sortBy, filters.sortOrder, handleChange]);

  // * Render profile filter groups (shared between profile and hybrid modes)
  const renderProfileFilters = useCallback(() => {
    const filterGroups = [
      {
        id: "filter-status",
        label: "Status",
        value: filters.filterStatus || FILTER_OPTIONS.VISIBILITY.VISIBLE,
        onChange: (value) =>
          handleChange(
            "filterStatus",
            value === "active"
              ? FILTER_OPTIONS.VISIBILITY.VISIBLE
              : value || FILTER_OPTIONS.VISIBILITY.VISIBLE
          ),
        options: FILTER_CONFIGS.visibility,
      },
      showUserFilter && {
        id: "filter-user",
        label: "User",
        value: filters.userFilter || FILTER_OPTIONS.USER.ALL,
        onChange: (value) => handleChange("userFilter", value),
        options: userOptions,
      },
      showSelectionFilter && {
        id: "filter-selection",
        label: "Selection",
        value: filters.selectionFilter || "all",
        onChange: (value) => handleChange("selectionFilter", value),
        options: FILTER_CONFIGS.selection,
      },
    ].filter(Boolean);

    return (
      <div className={styles.filterRow}>
        {filterGroups.map((config) => renderFilterGroup(config))}
      </div>
    );
  }, [
    filters.filterStatus,
    filters.userFilter,
    filters.selectionFilter,
    showUserFilter,
    showSelectionFilter,
    userOptions,
    handleChange,
    renderFilterGroup,
  ]);

  // * Unified render based on mode
  const isTournament = mode === "tournament";
  const isHybrid = mode === "hybrid";
  const showFilters = isHybrid || mode === "profile";

  return isTournament ? (
    <div
      className={`${styles.unifiedBar} ${className}`}
      data-component="unified-filters"
      data-mode={mode}
      aria-label="Display options"
    >
      <div className={styles.unifiedContainer}>
        {renderActions()}
        {startTournamentButton && (
          <button
            className={styles.startTournamentButton}
            onClick={startTournamentButton.onClick}
            type="button"
          >
            Start Tournament ({startTournamentButton.selectedCount})
          </button>
        )}
      </div>
    </div>
  ) : (
    <div className={`${styles.filtersContainer} ${className}`}>
      {renderResultsCount()}

      {isHybrid && (
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
      )}

      {showFilters && (
        <div className={styles.filtersGrid}>
          {renderProfileFilters()}
          {renderSortControls()}
        </div>
      )}
    </div>
  );
}

const filterShape = PropTypes.shape({
  searchTerm: PropTypes.string,
  category: PropTypes.string,
  sortBy: PropTypes.string,
  filterStatus: PropTypes.string,
  userFilter: PropTypes.string,
  selectionFilter: PropTypes.string,
  sortOrder: PropTypes.string,
});

const optionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

TournamentToolbar.propTypes = {
  mode: PropTypes.oneOf(["tournament", "profile", "hybrid"]),
  filters: filterShape,
  onFilterChange: PropTypes.func.isRequired,
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  categories: PropTypes.arrayOf(PropTypes.string),
  showUserFilter: PropTypes.bool,
  showSelectionFilter: PropTypes.bool,
  userSelectOptions: PropTypes.arrayOf(optionShape),
  selectedCount: PropTypes.number,
  showSelectedOnly: PropTypes.bool,
  onToggleShowSelected: PropTypes.func,
  isSwipeMode: PropTypes.bool,
  onToggleSwipeMode: PropTypes.func,
  showCatPictures: PropTypes.bool,
  onToggleCatPictures: PropTypes.func,
  analysisMode: PropTypes.bool,
  startTournamentButton: PropTypes.shape({
    onClick: PropTypes.func.isRequired,
    selectedCount: PropTypes.number.isRequired,
  }),
  className: PropTypes.string,
};

// * Memoize component to prevent unnecessary re-renders
const MemoizedTournamentToolbar = React.memo(TournamentToolbar);
export { MemoizedTournamentToolbar as TournamentToolbar };
