/**
 * @module Tournament/components/TournamentHeader
 * @description Header component for tournament view with progress information
 */

import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import { StartButton } from "../index";
import styles from "../../Tournament.module.css";
import setupStyles from "../../TournamentSetup.module.css";

function TournamentHeader({
  // Tournament phase props
  roundNumber,
  currentMatchNumber,
  totalMatches,
  progress,
  // Setup phase props
  selectedNames,
  availableNames,
  onSelectAll,
  isSwipeMode,
  onSwipeModeToggle,
  showCatPictures,
  onCatPicturesToggle,
  onStart,
  isAdmin,
}) {
  // Determine if we're in setup mode (has selectedNames) or tournament mode (has roundNumber)
  const isSetupMode = selectedNames !== undefined;

  if (isSetupMode) {
    // Setup mode: show progress and controls
    return (
      <div className={setupStyles.panelHeader}>
        <div className={setupStyles.headerRow}>
          <div className={setupStyles.headerActions}>
            {isAdmin && (
              <button
                className={setupStyles.selectAllButton}
                onClick={onSelectAll}
                type="button"
                aria-label={
                  selectedNames.length === availableNames.length
                    ? "Clear all selections"
                    : "Select all names"
                }
              >
                {selectedNames.length === availableNames.length
                  ? "✨ Start Fresh"
                  : "🎲 Select All"}
              </button>
            )}

            {onSwipeModeToggle && (
              <button
                onClick={onSwipeModeToggle}
                className={`${setupStyles.headerActionButton} ${setupStyles.swipeModeToggleButton} ${
                  isSwipeMode ? setupStyles.headerActionButtonActive : ""
                }`}
                type="button"
                aria-label={
                  isSwipeMode ? "Switch to card mode" : "Switch to swipe mode"
                }
              >
                {isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
              </button>
            )}

            {onCatPicturesToggle && (
              <button
                onClick={onCatPicturesToggle}
                className={`${setupStyles.headerActionButton} ${setupStyles.catPicturesToggleButton} ${
                  showCatPictures ? setupStyles.headerActionButtonActive : ""
                }`}
                type="button"
                aria-label={
                  showCatPictures
                    ? "Hide cat pictures"
                    : "Show cat pictures on cards"
                }
                title="Add random cat pictures to make it more like Tinder! 🐱"
              >
                {showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
              </button>
            )}

            {selectedNames.length >= 2 && (
              <StartButton
                selectedNames={selectedNames}
                onStart={onStart}
                variant="header"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tournament mode: show round and match info inline
  return (
    <Card
      className={styles.progressInfo}
      background="glass"
      padding="none"
      shadow="medium"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.roundInfo}>
        <span className={styles.roundNumber}>Round {roundNumber}</span>
        <span className={styles.matchCount}>
          Match {currentMatchNumber} of {totalMatches}
        </span>
        <div
          className={styles.percentageInfo}
          aria-label={`Tournament is ${progress}% complete`}
        >
          {progress}% Complete
        </div>
      </div>
    </Card>
  );
}

TournamentHeader.propTypes = {
  // Tournament phase props
  roundNumber: PropTypes.number,
  currentMatchNumber: PropTypes.number,
  totalMatches: PropTypes.number,
  progress: PropTypes.number,
  // Setup phase props
  selectedNames: PropTypes.arrayOf(PropTypes.object),
  availableNames: PropTypes.arrayOf(PropTypes.object),
  onSelectAll: PropTypes.func,
  isSwipeMode: PropTypes.bool,
  onSwipeModeToggle: PropTypes.func,
  showCatPictures: PropTypes.bool,
  onCatPicturesToggle: PropTypes.func,
  onStart: PropTypes.func,
  isAdmin: PropTypes.bool,
};

export default TournamentHeader;
