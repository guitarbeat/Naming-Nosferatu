/**
 * @module UnifiedFilters
 * @description Unified filter controls component for both Tournament and Profile views.
 * Supports different filter sets based on mode.
 */

import React from "react";
import PropTypes from "prop-types";
import Select from "../Form/Select";
import { FILTER_OPTIONS } from "../../../core/constants";
import styles from "./UnifiedFilters.module.css";

/**
 * UnifiedFilters Component
 * @param {Object} props
 * @param {string} props.mode - Display mode: 'tournament' or 'profile'
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Handler for filter changes
 * @param {number} props.filteredCount - Number of filtered results
 * @param {number} props.totalCount - Total number of items
 * @param {Array} props.categories - Available categories (tournament mode)
 * @param {boolean} props.showUserFilter - Show user filter (profile mode, admin only)
 * @param {boolean} props.showSelectionFilter - Show selection filter (profile mode)
 * @param {Array} props.userSelectOptions - Custom user filter options (profile mode)
 */
export function UnifiedFilters({
  mode = "tournament",
  filters = {},
  onFilterChange,
  filteredCount = 0,
  totalCount = 0,
  categories = [],
  showUserFilter = false,
  showSelectionFilter = false,
  userSelectOptions,
  className = "",
}) {
  // * Tournament mode filter options
  const tournamentSortOptions = [
    { value: "alphabetical", label: "A-Z" },
    { value: "rating", label: "Rating" },
    { value: "recent", label: "Recent" },
  ];

  // * Profile mode filter options
  const statusOptions = [
    { value: FILTER_OPTIONS.STATUS.ALL, label: "All Names" },
    { value: FILTER_OPTIONS.STATUS.ACTIVE, label: "Active Only" },
    { value: FILTER_OPTIONS.STATUS.HIDDEN, label: "Hidden Only" },
  ];

  const defaultUserOptions = [
    { value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
    { value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
    { value: FILTER_OPTIONS.USER.OTHER, label: "Other Users" },
  ];

  const profileSortOptions = [
    { value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
    { value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
    { value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
    { value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
    { value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
    { value: FILTER_OPTIONS.SORT.CREATED, label: "Created" },
  ];

  const selectionFilterOptions = [
    { value: "all", label: "All Names" },
    { value: "selected", label: "Ever Selected" },
    { value: "never_selected", label: "Never Selected" },
    { value: "frequently_selected", label: "Frequently Selected" },
    { value: "recently_selected", label: "Recently Selected" },
  ];

  const userOptions = userSelectOptions || defaultUserOptions;

  // * Handle filter changes
  const handleChange = (filterName, value) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, [filterName]: value });
    }
  };

  // * Tournament mode: compact inline filters
  if (mode === "tournament") {
    return (
      <div className={`${styles.tournamentFilters} ${className}`}>
        {/* Search bar */}
        <div className={styles.searchBar}>
          <input
            type="text"
            value={filters.searchTerm || ""}
            onChange={(e) => handleChange("searchTerm", e.target.value)}
            placeholder="🔍 Search cat names..."
            className={styles.searchInput}
            aria-label="Search cat names"
          />
          {/* Compact filters next to search */}
          <div className={styles.compactFilters}>
            {categories.length > 0 && (
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  handleChange("category", e.target.value || null)
                }
                className={styles.compactSelect}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
            <select
              value={filters.sortBy || "alphabetical"}
              onChange={(e) => handleChange("sortBy", e.target.value)}
              className={styles.compactSelect}
              aria-label="Sort names"
            >
              {tournamentSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // * Profile mode: full filter panel
  return (
    <div className={`${styles.filtersContainer} ${className}`}>
      {/* Results Count */}
      <div className={styles.resultsCount}>
        <span className={styles.count}>{filteredCount}</span>
        {filteredCount !== totalCount && (
          <>
            <span className={styles.separator}>/</span>
            <span className={styles.total}>{totalCount}</span>
            <span className={styles.badge}>filtered</span>
          </>
        )}
      </div>

      {/* Filter Controls */}
      <div className={styles.filtersGrid}>
        {/* Primary Filters */}
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-status" className={styles.filterLabel}>
              Status
            </label>
            <Select
              id="filter-status"
              name="filter-status"
              value={filters.filterStatus || FILTER_OPTIONS.STATUS.ALL}
              onChange={(e) => handleChange("filterStatus", e.target.value)}
              options={statusOptions}
              className={styles.filterSelect}
            />
          </div>

          {showUserFilter && (
            <div className={styles.filterGroup}>
              <label htmlFor="filter-user" className={styles.filterLabel}>
                User
              </label>
              <Select
                id="filter-user"
                name="filter-user"
                value={filters.userFilter || FILTER_OPTIONS.USER.ALL}
                onChange={(e) => handleChange("userFilter", e.target.value)}
                options={userOptions}
                className={styles.filterSelect}
              />
            </div>
          )}

          {showSelectionFilter && (
            <div className={styles.filterGroup}>
              <label htmlFor="filter-selection" className={styles.filterLabel}>
                Selection
              </label>
              <Select
                id="filter-selection"
                name="filter-selection"
                value={filters.selectionFilter || "all"}
                onChange={(e) =>
                  handleChange("selectionFilter", e.target.value)
                }
                options={selectionFilterOptions}
                className={styles.filterSelect}
              />
            </div>
          )}
        </div>

        {/* Sort Controls */}
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
                options={profileSortOptions}
                className={styles.filterSelect}
              />
              <button
                type="button"
                onClick={() =>
                  handleChange(
                    "sortOrder",
                    filters.sortOrder === FILTER_OPTIONS.ORDER.ASC
                      ? FILTER_OPTIONS.ORDER.DESC
                      : FILTER_OPTIONS.ORDER.ASC
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
      </div>
    </div>
  );
}

UnifiedFilters.propTypes = {
  mode: PropTypes.oneOf(["tournament", "profile"]),
  filters: PropTypes.shape({
    // Tournament filters
    searchTerm: PropTypes.string,
    category: PropTypes.string,
    sortBy: PropTypes.string,
    // Profile filters
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
    })
  ),
  className: PropTypes.string,
};
