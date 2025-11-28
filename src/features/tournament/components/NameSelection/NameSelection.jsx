/**
 * @module TournamentSetup/components/NameSelection
 * @description Name selection component with admin filtering options
 */
import { useMemo, memo } from "react";
import PropTypes from "prop-types";
import { NameGrid } from "../../../../shared/components";
import { filterAndSortNames } from "../../utils";
import ResultsInfo from "./ResultsInfo";
import styles from "../../TournamentSetup.module.css";

function NameSelection({
  selectedNames,
  availableNames,
  onToggleName,
  isAdmin,
  // Filter props
  selectedCategory,
  searchTerm,
  sortBy,
  isSwipeMode,
  showCatPictures,
  imageList,
  // Swipeable cards component passed as prop
  SwipeableCards,
  showSelectedOnly,
  // Admin control props for name hiding
  hiddenIds,
  onToggleVisibility,
  onDelete,
}) {
  // * Calculate filtered names for SwipeMode (SwipeableCards needs pre-filtered names)
  const filteredNamesForSwipe = useMemo(() => {
    const filtered = filterAndSortNames(availableNames, {
      category: selectedCategory,
      searchTerm,
      sortBy,
    });
    return showSelectedOnly
      ? filtered.filter((name) =>
          selectedNames.some((selected) => selected.id === name.id),
        )
      : filtered;
  }, [
    availableNames,
    selectedCategory,
    searchTerm,
    sortBy,
    showSelectedOnly,
    selectedNames,
  ]);

  // * Calculate filtered count for ResultsInfo display
  const filteredCount = filteredNamesForSwipe.length;

  return (
    <div className={styles.nameSelection}>
      {/* Swipe Mode Instructions */}
      {isSwipeMode && (
        <div className={styles.swipeModeInstructions}>
          <span>
            👈 Swipe left to remove • 👉 Swipe right to select for tournament
          </span>
        </div>
      )}

      {/* Results count */}
      <ResultsInfo
        displayCount={filteredCount}
        totalCount={availableNames.length}
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
      />

      {isSwipeMode ? (
        <SwipeableCards
          names={filteredNamesForSwipe}
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
          filters={{
            category: selectedCategory,
            searchTerm,
            sortBy,
          }}
          mode="tournament"
          isAdmin={isAdmin}
          showSelectedOnly={showSelectedOnly}
          showCatPictures={showCatPictures}
          imageList={imageList}
          showAdminControls={isAdmin}
          hiddenIds={hiddenIds}
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
  isAdmin: PropTypes.bool.isRequired,
  selectedCategory: PropTypes.string,
  searchTerm: PropTypes.string,
  sortBy: PropTypes.string,
  isSwipeMode: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageList: PropTypes.arrayOf(PropTypes.string),
  SwipeableCards: PropTypes.elementType,
  showSelectedOnly: PropTypes.bool,
  // Admin control props
  hiddenIds: PropTypes.instanceOf(Set),
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
};

export default memo(NameSelection);
