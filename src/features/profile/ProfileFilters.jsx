import React from "react";
import PropTypes from "prop-types";
import { FILTER_OPTIONS } from "../../core/constants";
import { Card, Select } from "../../shared/components";
import FilterGroup from "../../shared/components/FilterGroup/FilterGroup";
import styles from "./ProfileFilters.module.css";

/**
 * @module ProfileFilters
 * @description Handles filtering and sorting controls for the profile view.
 * Now includes selection-based filtering and sorting options.
 */

const ProfileFilters = ({
  filterStatus,
  setFilterStatus,
  userFilter,
  setUserFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  isAdmin = false,
  className = "",
  selectionFilter = "all",
  setSelectionFilter,
  hasSelectionData = false,
  filteredCount = 0,
  totalCount = 0,
  onApplyFilters = null,
}) => {
  const handleSortOrderToggle = () => {
    setSortOrder(
      sortOrder === FILTER_OPTIONS.ORDER.ASC
        ? FILTER_OPTIONS.ORDER.DESC
        : FILTER_OPTIONS.ORDER.ASC
    );
  };

  const statusOptions = [
    { value: FILTER_OPTIONS.STATUS.ALL, label: "All Names" },
    { value: FILTER_OPTIONS.STATUS.ACTIVE, label: "Active Only" },
    { value: FILTER_OPTIONS.STATUS.HIDDEN, label: "Hidden Only" },
  ];

  const userOptions = [
    { value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
    { value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
  ];

  if (isAdmin) {
    userOptions.push({
      value: FILTER_OPTIONS.USER.OTHER,
      label: "Other Users",
    });
  }

  const selectionOptions = [
    { value: "all", label: "All Names" },
    { value: "selected", label: "Names I've Selected" },
    { value: "never_selected", label: "Names I've Never Selected" },
    { value: "frequently_selected", label: "Frequently Selected" },
    { value: "recently_selected", label: "Recently Selected" },
  ];

  const sortOptions = [
    { value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
    { value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
    { value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
    { value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
    { value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
    { value: FILTER_OPTIONS.SORT.CREATED, label: "Created Date" },
  ];

  if (hasSelectionData) {
    sortOptions.push(
      { value: "selection_count", label: "Selection Count" },
      { value: "last_selected", label: "Last Selected" },
      { value: "selection_frequency", label: "Selection Frequency" },
      { value: "tournament_appearances", label: "Tournament Appearances" }
    );
  }

  const containerClasses = [styles.container, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      <div className={styles.controlBar}>
        <div className={styles.filterInputs}>
          <Select
            name="status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            className={styles.filterSelect}
            placeholder="Status"
          />
          <Select
            name="user"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            options={userOptions}
            className={styles.filterSelect}
            placeholder="User"
          />
          {hasSelectionData && (
            <Select
              name="selection"
              value={selectionFilter}
              onChange={(e) => setSelectionFilter(e.target.value)}
              options={selectionOptions}
              className={styles.filterSelect}
              placeholder="Selection"
            />
          )}
          <Select
            name="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
            className={styles.filterSelect}
            placeholder="Sort"
          />
          <button
            type="button"
            onClick={handleSortOrderToggle}
            className={styles.orderButton}
            aria-label={`Sort ${sortOrder === FILTER_OPTIONS.ORDER.ASC ? "ascending" : "descending"}`}
            title={sortOrder === FILTER_OPTIONS.ORDER.ASC ? "Ascending" : "Descending"}
          >
            {sortOrder === FILTER_OPTIONS.ORDER.ASC ? "↑" : "↓"}
          </button>
        </div>

        <div className={styles.resultsSummary}>
          <span className={styles.summaryText}>
            {filteredCount} of {totalCount}
            {filteredCount !== totalCount && " (Filtered)"}
          </span>
          {onApplyFilters && (
            <button
              type="button"
              className={styles.applyButton}
              onClick={onApplyFilters}
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ProfileFilters.propTypes = {
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  userFilter: PropTypes.string.isRequired,
  setUserFilter: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  setSortOrder: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  className: PropTypes.string,
  // * New props for selection-based filtering
  selectionFilter: PropTypes.string,
  setSelectionFilter: PropTypes.func,
  hasSelectionData: PropTypes.bool,
  // * Filter count and apply function
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  onApplyFilters: PropTypes.func,
};

export default ProfileFilters;
