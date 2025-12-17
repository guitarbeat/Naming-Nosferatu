import { useMemo } from "react";
import PropTypes from "prop-types";
import Select from "../Form/Select";
import { FILTER_OPTIONS } from "../../../core/constants";
import { FILTER_CONFIGS } from "./filterConfigs";
import FilterSelect from "./FilterSelect";
import SortOrderIcon from "./SortOrderIcon";
import { styles } from "./styles";

function FilterModeToolbar({
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
}) {
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
            value={filters.category}
            options={categoryOptions}
            onChange={(value) => onFilterChange("category", value)}
          />
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
              onChange={(value) =>
                onFilterChange(
                  "filterStatus",
                  value === "active"
                    ? FILTER_OPTIONS.VISIBILITY.VISIBLE
                    : value || FILTER_OPTIONS.VISIBILITY.VISIBLE,
                )
              }
            />
            {showUserFilter && (
              <FilterSelect
                id="filter-user"
                label="User"
                value={filters.userFilter || FILTER_OPTIONS.USER.ALL}
                options={userOptions || FILTER_CONFIGS.users}
                onChange={(value) => onFilterChange("userFilter", value)}
              />
            )}
            {showSelectionFilter && (
              <FilterSelect
                id="filter-selection"
                label="Selection"
                value={filters.selectionFilter || "all"}
                options={FILTER_CONFIGS.selection}
                onChange={(value) => onFilterChange("selectionFilter", value)}
              />
            )}
            {analysisMode && (
              <FilterSelect
                id="filter-date"
                label="Date"
                value={filters.dateFilter || "all"}
                options={FILTER_CONFIGS.date}
                onChange={(value) => onFilterChange("dateFilter", value)}
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
                  id="filter-sort"
                  name="filter-sort"
                  value={filters.sortBy || FILTER_OPTIONS.SORT.RATING}
                  onChange={(e) => onFilterChange("sortBy", e.target.value)}
                  options={FILTER_CONFIGS.sort}
                  className={styles.filterSelect}
                />
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange(
                      "sortOrder",
                      isAsc
                        ? FILTER_OPTIONS.ORDER.DESC
                        : FILTER_OPTIONS.ORDER.ASC,
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

export default FilterModeToolbar;
