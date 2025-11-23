/**
 * @module TournamentSetup/components/FilterControls
 * @description Admin-only filter controls for category, search, and sort
 */
import PropTypes from "prop-types";
import { Input, Select } from "../../../../shared/components";
import { SORT_OPTIONS } from "../../constants";
import styles from "../../TournamentSetup.module.css";

function FilterControls({
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className={styles.controlsSection}>
      {/* Search filter - primary action */}
      <div className={styles.filterGroup}>
        <Input
          name="search-filter"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔍 Search names..."
          className={styles.searchInput}
          type="text"
        />
      </div>

      {/* Compact filters row */}
      <div className={styles.compactFilters}>
        {/* Category filter */}
        {categoryOptions.length > 0 && (
          <Select
            name="category"
            value={selectedCategory ?? ""}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            options={categoryOptions}
            className={styles.filterSelect}
            placeholder="All Categories"
          />
        )}

        {/* Sort options */}
        <Select
          name="sort-filter"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          options={SORT_OPTIONS}
          className={styles.filterSelect}
          placeholder="Sort"
        />
      </div>
    </div>
  );
}

FilterControls.propTypes = {
  categoryOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    }),
  ).isRequired,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
};

export default FilterControls;
