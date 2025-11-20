/**
 * @module Tournament/components/TournamentHeader
 * @description Header component for tournament view with progress information
 */

import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import styles from "../../Tournament.module.css";

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
  isSwipeMode: _isSwipeMode,
  onSwipeModeToggle: _onSwipeModeToggle,
  showCatPictures: _showCatPictures,
  onCatPicturesToggle: _onCatPicturesToggle,
  onStart: _onStart,
  isAdmin,
}) {
  // Determine if we're in setup mode (has selectedNames) or tournament mode (has roundNumber)
  const isSetupMode = selectedNames !== undefined;

  if (isSetupMode) {
    // Setup mode: show progress and controls
    const progressPercent =
      availableNames && availableNames.length > 0
        ? Math.max((selectedNames.length / availableNames.length) * 100, 5)
        : 0;

    return (
      <div className={styles.panelHeader}>
        <div className={styles.headerRow}>
          <div className={styles.headerActions}>
            {isAdmin && (
              <button
                className={styles.selectAllButton}
                onClick={onSelectAll}
                type="button"
              >
                {selectedNames.length === availableNames.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Tournament mode: show round and match info
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
      </div>
      <div
        className={styles.percentageInfo}
        aria-label={`Tournament is ${progress}% complete`}
      >
        {progress}% Complete
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
