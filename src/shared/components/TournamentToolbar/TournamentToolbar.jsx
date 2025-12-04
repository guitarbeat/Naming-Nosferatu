import React from "react";
import PropTypes from "prop-types";
import Select from "../Form/Select";
import { FILTER_OPTIONS } from "../../../core/constants";
import styles from "./TournamentToolbar.module.css";

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

const Toggle = ({ isActive, onClick, activeLabel, inactiveLabel, ariaLabel }) => (
  <div className={styles.toggleWrapper}>
    <button
      type="button"
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

const FilterSelect = ({ id, label, value, options, onChange }) => (
  <div className={styles.filterGroup}>
    <label htmlFor={id} className={styles.filterLabel}>{label}</label>
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
  isSwipeMode,
  onToggleSwipeMode,
  showCatPictures,
  onToggleCatPictures,
  startTournamentButton,
  className = "",
}) {
  const update = (name, value) => onFilterChange?.({ ...filters, [name]: value });
  const isTournament = mode === "tournament";
  const isHybrid = mode === "hybrid";
  const showFilters = isHybrid || mode === "profile";
  const isAsc = filters.sortOrder === FILTER_OPTIONS.ORDER.ASC;

  if (isTournament) {
    return (
      <div className={`${styles.unifiedBar} ${className}`} data-mode={mode}>
        <div className={styles.unifiedContainer}>
          {(onToggleSwipeMode || onToggleCatPictures) && (
            <div className={styles.unifiedActions}>
              {onToggleSwipeMode && (
                <Toggle
                  isActive={isSwipeMode}
                  onClick={onToggleSwipeMode}
                  activeLabel="Tap"
                  inactiveLabel="Swipe"
                  ariaLabel={isSwipeMode ? "Switch to swipe mode" : "Switch to tap mode"}
                />
              )}
              {onToggleCatPictures && (
                <Toggle
                  isActive={showCatPictures}
                  onClick={onToggleCatPictures}
                  activeLabel="Cats"
                  inactiveLabel="Names"
                  ariaLabel={showCatPictures ? "Hide cat pictures" : "Show cat pictures"}
                />
              )}
            </div>
          )}
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
    );
  }

  return (
    <div className={`${styles.filtersContainer} ${className}`}>
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

      {isHybrid && (
        <div className={styles.filterRow}>
          <div className={styles.searchBar}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM13 13l-3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              value={filters.searchTerm || ""}
              onChange={(e) => update("searchTerm", e.target.value)}
              placeholder="Search names..."
              className={styles.searchInput}
              aria-label="Search cat names"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => update("searchTerm", "")}
                className={styles.searchClear}
                aria-label="Clear search"
                title="Clear search"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <FilterSelect
              id="filter-category"
              label="Category"
              value={filters.category}
              options={categories.map((cat) => ({ value: cat, label: cat }))}
              onChange={(value) => update("category", value)}
            />
          )}
        </div>
      )}

      {showFilters && (
        <div className={styles.filtersGrid}>
          <div className={styles.filterRow}>
            <FilterSelect
              id="filter-status"
              label="Status"
              value={filters.filterStatus || FILTER_OPTIONS.VISIBILITY.VISIBLE}
              options={FILTER_CONFIGS.visibility}
              onChange={(value) => update("filterStatus", value === "active" ? FILTER_OPTIONS.VISIBILITY.VISIBLE : value || FILTER_OPTIONS.VISIBILITY.VISIBLE)}
            />
            {showUserFilter && (
              <FilterSelect
                id="filter-user"
                label="User"
                value={filters.userFilter || FILTER_OPTIONS.USER.ALL}
                options={userSelectOptions || FILTER_CONFIGS.users}
                onChange={(value) => update("userFilter", value)}
              />
            )}
            {showSelectionFilter && (
              <FilterSelect
                id="filter-selection"
                label="Selection"
                value={filters.selectionFilter || "all"}
                options={FILTER_CONFIGS.selection}
                onChange={(value) => update("selectionFilter", value)}
              />
            )}
          </div>
          <div className={styles.filterRow}>
            <div className={styles.sortGroup}>
              <label htmlFor="filter-sort" className={styles.filterLabel}>Sort By</label>
              <div className={styles.sortControls}>
                <Select
                  id="filter-sort"
                  name="filter-sort"
                  value={filters.sortBy || FILTER_OPTIONS.SORT.RATING}
                  onChange={(e) => update("sortBy", e.target.value)}
                  options={FILTER_CONFIGS.sort}
                  className={styles.filterSelect}
                />
                <button
                  type="button"
                  onClick={() => update("sortOrder", isAsc ? FILTER_OPTIONS.ORDER.DESC : FILTER_OPTIONS.ORDER.ASC)}
                  className={styles.sortOrderButton}
                  title={`Sort ${isAsc ? "Descending" : "Ascending"}`}
                  aria-label={`Toggle sort order to ${isAsc ? "descending" : "ascending"}`}
                >
                  {isAsc ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
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

TournamentToolbar.displayName = "TournamentToolbar";

const MemoizedTournamentToolbar = React.memo(TournamentToolbar);
MemoizedTournamentToolbar.displayName = "TournamentToolbar";

export { MemoizedTournamentToolbar as TournamentToolbar };
