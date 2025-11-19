/**
 * @module TournamentSetup/components/HeaderActions
 * @description Action buttons for tournament header (select all, swipe mode, cat pictures, start)
 */
import PropTypes from "prop-types";
import { StartButton } from "../index";
import styles from "../../TournamentSetup.module.css";

function HeaderActions({
  selectedNamesCount,
  availableNamesCount,
  onSelectAll,
  isSwipeMode,
  onSwipeModeToggle,
  showCatPictures,
  onCatPicturesToggle,
  selectedNames,
  onStart,
}) {
  return (
    <div className={styles.headerActions}>
      <button
        onClick={onSelectAll}
        className={styles.selectAllButton}
        aria-label={
          selectedNamesCount === availableNamesCount
            ? "Clear all selections"
            : "Select all names"
        }
      >
        {selectedNamesCount === availableNamesCount
          ? "✨ Start Fresh"
          : "🎲 Select All"}
      </button>

      <button
        onClick={onSwipeModeToggle}
        className={`${styles.headerActionButton} ${styles.swipeModeToggleButton} ${
          isSwipeMode ? styles.headerActionButtonActive : ""
        }`}
        aria-label={
          isSwipeMode ? "Switch to card mode" : "Switch to swipe mode"
        }
      >
        {isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
      </button>

      <button
        onClick={onCatPicturesToggle}
        className={`${styles.headerActionButton} ${styles.catPicturesToggleButton} ${
          showCatPictures ? styles.headerActionButtonActive : ""
        }`}
        aria-label={
          showCatPictures ? "Hide cat pictures" : "Show cat pictures on cards"
        }
        title="Add random cat pictures to make it more like Tinder! 🐱"
      >
        {showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
      </button>

      {selectedNamesCount >= 2 && (
        <StartButton
          selectedNames={selectedNames}
          onStart={onStart}
          variant="header"
        />
      )}
    </div>
  );
}

HeaderActions.propTypes = {
  selectedNamesCount: PropTypes.number.isRequired,
  availableNamesCount: PropTypes.number.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  isSwipeMode: PropTypes.bool.isRequired,
  onSwipeModeToggle: PropTypes.func.isRequired,
  showCatPictures: PropTypes.bool.isRequired,
  onCatPicturesToggle: PropTypes.func.isRequired,
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onStart: PropTypes.func.isRequired,
};

export default HeaderActions;
