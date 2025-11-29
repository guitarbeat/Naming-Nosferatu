/**
 * @module NameSelection
 * @description Name selection component for tournament setup.
 * Simplified: uses unified filtering, no duplicate logic.
 */
import { useMemo, memo } from "react";
import PropTypes from "prop-types";
import { NameGrid } from "../../../../shared/components";
import { applyNameFilters } from "../../../../shared/utils/nameFilterUtils";
import ResultsInfo from "./ResultsInfo";
import styles from "../../TournamentSetup.module.css";

function NameSelection({
  selectedNames,
  availableNames,
  onToggleName,
  isAdmin,
  // Filters
  selectedCategory,
  searchTerm,
  sortBy,
  filterStatus,
  // Display options
  isSwipeMode,
  showCatPictures,
  imageList,
  SwipeableCards,
  showSelectedOnly,
  // Admin handlers
  onToggleVisibility,
  onDelete,
}) {
  // Build filter config
  const filters = useMemo(() => ({
    searchTerm,
    category: selectedCategory,
    sortBy,
    filterStatus,
  }), [searchTerm, selectedCategory, sortBy, filterStatus]);

  // Calculate filtered names for display count and swipe mode
  const filteredNames = useMemo(() => {
    const visibility = filterStatus === "hidden" ? "hidden" 
      : filterStatus === "all" ? "all" 
      : "visible";

    let result = applyNameFilters(availableNames, {
      searchTerm,
      category: selectedCategory,
      sortBy,
      visibility,
      isAdmin,
    });

    if (showSelectedOnly) {
      result = result.filter(name =>
        selectedNames.some(selected => selected.id === name.id)
      );
    }

    return result;
  }, [availableNames, searchTerm, selectedCategory, sortBy, filterStatus, isAdmin, showSelectedOnly, selectedNames]);

  return (
    <div className={styles.nameSelection}>
      {isSwipeMode && (
        <div className={styles.swipeModeInstructions}>
          <span>👈 Swipe left to remove • 👉 Swipe right to select</span>
        </div>
      )}

      <ResultsInfo
        displayCount={filteredNames.length}
        totalCount={availableNames.length}
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
      />

      {isSwipeMode ? (
        <SwipeableCards
          names={filteredNames}
          selectedNames={selectedNames}
          onToggleName={onToggleName}
          isAdmin={isAdmin}
          showCatPictures={showCatPictures}
          imageList={imageList}
        />
      ) : (
        <NameGrid
          names={availableNames}
          selectedNames={selectedNames}
          onToggleName={onToggleName}
          filters={filters}
          isAdmin={isAdmin}
          showSelectedOnly={showSelectedOnly}
          showCatPictures={showCatPictures}
          imageList={imageList}
          onToggleVisibility={onToggleVisibility}
          onDelete={onDelete}
          className={styles.cardsContainer}
        />
      )}
    </div>
  );
}

NameSelection.propTypes = {
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  availableNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleName: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  selectedCategory: PropTypes.string,
  searchTerm: PropTypes.string,
  sortBy: PropTypes.string,
  filterStatus: PropTypes.oneOf(["active", "hidden", "all"]),
  isSwipeMode: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageList: PropTypes.arrayOf(PropTypes.string),
  SwipeableCards: PropTypes.elementType,
  showSelectedOnly: PropTypes.bool,
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
};

export default memo(NameSelection);
