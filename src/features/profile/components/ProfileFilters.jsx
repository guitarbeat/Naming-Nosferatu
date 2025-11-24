/**
 * @module ProfileFilters
 * @description Reusable filter controls for the profile name list.
 * Uses design system components and standardized layout.
 */

import React from "react";
import PropTypes from "prop-types";
import { Select } from "../../../shared/components";
import { FILTER_OPTIONS } from "../../../core/constants";
import styles from "./ProfileFilters.module.css";

export function ProfileFilters({
  filterStatus,
  setFilterStatus,
  userFilter,
  setUserFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  selectionFilter,
  setSelectionFilter,
  showUserFilter = false,
  showSelectionFilter = false,
  userSelectOptions,
  filteredCount,
  totalCount,
}) {
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

  const sortOptions = [
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

  return (
    <div className={styles.filtersContainer}>
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
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
                value={selectionFilter}
                onChange={(e) => setSelectionFilter(e.target.value)}
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={sortOptions}
                className={styles.filterSelect}
              />
              <button
                type="button"
                onClick={() =>
                  setSortOrder(
                    sortOrder === FILTER_OPTIONS.ORDER.ASC
                      ? FILTER_OPTIONS.ORDER.DESC
                      : FILTER_OPTIONS.ORDER.ASC,
                  )
                }
                className={styles.sortOrderButton}
                title={`Sort ${sortOrder === FILTER_OPTIONS.ORDER.ASC ? "Descending" : "Ascending"}`}
                aria-label={`Toggle sort order to ${sortOrder === FILTER_OPTIONS.ORDER.ASC ? "descending" : "ascending"}`}
              >
                {sortOrder === FILTER_OPTIONS.ORDER.ASC ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ProfileFilters.propTypes = {
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  userFilter: PropTypes.string.isRequired,
  setUserFilter: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  setSortOrder: PropTypes.func.isRequired,
  selectionFilter: PropTypes.string,
  setSelectionFilter: PropTypes.func,
  showUserFilter: PropTypes.bool,
  showSelectionFilter: PropTypes.bool,
  userSelectOptions: PropTypes.array,
  filteredCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
};
