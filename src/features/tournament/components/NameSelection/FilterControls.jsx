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
      {/* Category filter */}
      {categoryOptions.length > 0 && (
        <div className={styles.filterGroup}>
          <Select
            name="category"
            label="Category"
            value={selectedCategory ?? ""}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            options={categoryOptions}
            className={styles.filterSelect}
            placeholder=""
          />
        </div>
      )}

      {/* Search filter */}
      <div className={styles.filterGroup}>
        <Input
          name="search-filter"
          label="Search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search names or descriptions..."
          className={styles.searchInput}
          type="text"
        />
      </div>

      {/* Sort options */}
      <div className={styles.filterGroup}>
        <Select
          name="sort-filter"
          label="Sort by"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          options={SORT_OPTIONS}
          className={styles.filterSelect}
          placeholder=""
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
    })
  ).isRequired,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
};

export default FilterControls;

