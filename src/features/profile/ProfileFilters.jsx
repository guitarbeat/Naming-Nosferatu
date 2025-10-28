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
  // * New selection-based filter props
  selectionFilter = "all",
  setSelectionFilter,
  hasSelectionData = false,
  // * Filter count and apply function
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
    <Card className={containerClasses} shadow="medium">
      <h3 className={styles.sectionTitle}>Filters & Sorting</h3>

      <div className={styles.filtersGrid}>
        {/* * Status Filter */}
        <FilterGroup>
          <Select
            name="status"
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            className={styles.filterSelect}
            placeholder=""
          />
        </FilterGroup>

        {/* * User Filter */}
        <FilterGroup>
          <Select
            name="user"
            label="User"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            options={userOptions}
            className={styles.filterSelect}
            placeholder=""
          />
        </FilterGroup>

        {/* * NEW: Selection Status Filter */}
        {hasSelectionData && (
          <FilterGroup>
            <Select
              name="selection"
              label="Selection Status"
              value={selectionFilter}
              onChange={(e) => setSelectionFilter(e.target.value)}
              options={selectionOptions}
              className={styles.filterSelect}
              placeholder=""
            />
          </FilterGroup>
        )}

        {/* * Sort By - Enhanced with selection options */}
        <FilterGroup>
          <Select
            name="sort"
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
            className={styles.filterSelect}
            placeholder=""
          />
        </FilterGroup>

        {/* * Sort Order Toggle */}
        <FilterGroup label="Order">
          <button
            type="button"
            onClick={handleSortOrderToggle}
            className={styles.sortOrderButton}
            aria-label={`Sort ${sortOrder === FILTER_OPTIONS.ORDER.ASC ? "ascending" : "descending"}`}
          >
            <span className={styles.sortOrderIcon}>
              {sortOrder === FILTER_OPTIONS.ORDER.ASC ? "↑" : "↓"}
            </span>
            <span className={styles.sortOrderText}>
              {sortOrder === FILTER_OPTIONS.ORDER.ASC
                ? "Ascending"
                : "Descending"}
            </span>
          </button>
        </FilterGroup>
      </div>

      {/* * Filter Results Display */}
      <Card
        className={styles.filterResults}
        padding="small"
        shadow="small"
        background="glass"
        as="section"
        aria-label="Filter results summary"
      >
        <div className={styles.resultsBar}>
          <div className={styles.resultsInfo}>
            <span className={styles.resultsCount}>
              Showing {filteredCount} of {totalCount} names
            </span>
            {filteredCount !== totalCount && (
              <span className={styles.filteredIndicator}>(Filtered)</span>
            )}
          </div>
          {onApplyFilters && (
            <button
              type="button"
              className={styles.applyButton}
              onClick={onApplyFilters}
            >
              Apply Filters
            </button>
          )}
        </div>

        {/* * Active Filters Display */}
        <div className={styles.activeFiltersList}>
          <span className={styles.activeFilterLabel}>Active:</span>
          <span className={styles.activeFilter}>
            Status:{" "}
            {filterStatus === FILTER_OPTIONS.STATUS.ALL ? "All" : filterStatus}
          </span>
          <span className={styles.activeFilter}>
            User: {userFilter === FILTER_OPTIONS.USER.ALL ? "All" : userFilter}
          </span>
          {hasSelectionData && selectionFilter !== "all" && (
            <span className={styles.activeFilter}>
              Selection:{" "}
              {selectionFilter
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          )}
          <span className={styles.activeFilter}>
            Sort:{" "}
            {sortBy.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
            ({sortOrder})
          </span>
        </div>
      </Card>
    </Card>
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
