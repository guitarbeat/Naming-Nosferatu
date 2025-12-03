/**
 * @module TournamentSetup/components/ResultsInfo
 * @description Unified display for results count, filter info, selection count, and action buttons
 */
import PropTypes from "prop-types";
import styles from "../../TournamentSetup.module.css";

function ResultsInfo({
  displayCount,
  totalCount,
  selectedCount,
  selectedCategory,
  searchTerm,
  // Action buttons
  showSelectedOnly,
  onToggleShowSelected,
  isSwipeMode,
  onToggleSwipeMode,
  showCatPictures,
  onToggleCatPictures,
  analysisMode,
}) {
  const hasFilters = selectedCategory || searchTerm;
  const hasSelection = selectedCount !== undefined && selectedCount !== null;
  const showActions =
    !analysisMode &&
    (onToggleShowSelected || onToggleSwipeMode || onToggleCatPictures);

  return (
    <div className={styles.resultsInfo}>
      <div className={styles.resultsInfoContent}>
        <span className={styles.resultsCount}>
          {hasSelection && (
            <span className={styles.selectionCount}>
              {selectedCount} of {totalCount} selected
            </span>
          )}
          {!hasSelection && (
            <>
              Showing {displayCount} of {totalCount} names
              {selectedCategory && ` in "${selectedCategory}" category`}
              {searchTerm && ` matching "${searchTerm}"`}
            </>
          )}
          {hasSelection && hasFilters && (
            <span className={styles.filterInfo}>
              {" • "}
              Showing {displayCount}
              {selectedCategory && ` in "${selectedCategory}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
          )}
        </span>

        {showActions && (
          <div className={styles.resultsActions}>
            {onToggleShowSelected && selectedCount > 0 && (
              <button
                type="button"
                onClick={onToggleShowSelected}
                className={
                  showSelectedOnly
                    ? styles.resultsActionButtonActive
                    : styles.resultsActionButton
                }
                aria-label={
                  showSelectedOnly ? "Show all names" : "Show selected only"
                }
              >
                {showSelectedOnly ? "👁️ Show All" : "👀 Show Selected"}
              </button>
            )}

            {onToggleSwipeMode && (
              <button
                type="button"
                onClick={onToggleSwipeMode}
                className={
                  isSwipeMode
                    ? styles.resultsActionButtonActive
                    : styles.resultsActionButton
                }
                aria-label={
                  isSwipeMode ? "Switch to card mode" : "Switch to swipe mode"
                }
              >
                {isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
              </button>
            )}

            {onToggleCatPictures && (
              <button
                type="button"
                onClick={onToggleCatPictures}
                className={
                  showCatPictures
                    ? styles.resultsActionButtonActive
                    : styles.resultsActionButton
                }
                aria-label={
                  showCatPictures ? "Hide cat pictures" : "Show cat pictures"
                }
              >
                {showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ResultsInfo.propTypes = {
  displayCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  selectedCount: PropTypes.number,
  selectedCategory: PropTypes.string,
  searchTerm: PropTypes.string,
  // Action buttons
  showSelectedOnly: PropTypes.bool,
  onToggleShowSelected: PropTypes.func,
  isSwipeMode: PropTypes.bool,
  onToggleSwipeMode: PropTypes.func,
  showCatPictures: PropTypes.bool,
  onToggleCatPictures: PropTypes.func,
  analysisMode: PropTypes.bool,
};

export default ResultsInfo;
