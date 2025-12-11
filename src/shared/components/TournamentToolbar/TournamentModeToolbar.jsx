import PropTypes from "prop-types";
import StartTournamentButton from "../StartTournamentButton/StartTournamentButton";
import BinaryToggle from "./BinaryToggle";
import { styles } from "./styles";

function TournamentModeToolbar({
  onToggleSwipeMode,
  isSwipeMode,
  onToggleCatPictures,
  showCatPictures,
  startTournamentButton,
  mode,
}) {
  return (
    <div className={styles.unifiedContainer} data-mode={mode}>
      {(onToggleSwipeMode || onToggleCatPictures) && (
        <div className={styles.toggleStack}>
          {onToggleSwipeMode && (
            <BinaryToggle
              isActive={isSwipeMode}
              onClick={onToggleSwipeMode}
              activeLabel="Tap"
              inactiveLabel="Swipe"
              ariaLabel={
                isSwipeMode ? "Switch to swipe mode" : "Switch to tap mode"
              }
            />
          )}
          {onToggleCatPictures && (
            <BinaryToggle
              isActive={showCatPictures}
              onClick={onToggleCatPictures}
              activeLabel="Cats"
              inactiveLabel="Names"
              ariaLabel={
                showCatPictures ? "Hide cat pictures" : "Show cat pictures"
              }
            />
          )}
        </div>
      )}
      {startTournamentButton && (
        <StartTournamentButton
          onClick={startTournamentButton.onClick}
          className={styles.startButton}
          ariaLabel={`Start Tournament with ${startTournamentButton.selectedCount} selected name${startTournamentButton.selectedCount !== 1 ? "s" : ""}`}
        >
          Start Tournament ({startTournamentButton.selectedCount})
        </StartTournamentButton>
      )}
    </div>
  );
}

TournamentModeToolbar.propTypes = {
  onToggleSwipeMode: PropTypes.func,
  isSwipeMode: PropTypes.bool,
  onToggleCatPictures: PropTypes.func,
  showCatPictures: PropTypes.bool,
  startTournamentButton: PropTypes.shape({
    onClick: PropTypes.func.isRequired,
    selectedCount: PropTypes.number.isRequired,
  }),
  mode: PropTypes.string,
};

export default TournamentModeToolbar;
