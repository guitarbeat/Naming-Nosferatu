import PropTypes from "prop-types";
import { TournamentButton } from "@components";
import { BinaryToggle } from "./components";
import { styles } from "./styles";

function TournamentModeToolbar({
  onToggleSwipeMode,
  isSwipeMode,
  onToggleCatPictures,
  showCatPictures,
  startTournamentButton,
  mode,
}) {
  const selectedCount = startTournamentButton?.selectedCount ?? 0;
  const isReady = selectedCount >= 2;
  const countLabel =
    selectedCount === 1 ? "1 selected name" : `${selectedCount} selected names`;

  const buttonLabel = isReady
    ? `Start the tournament with ${countLabel}`
    : "Select at least 2 names to start";

  return (
    <div className={styles.unifiedContainer} data-mode={mode}>
      {(onToggleSwipeMode || onToggleCatPictures) && (
        <div className={styles.toggleStack}>
          {onToggleSwipeMode && (
            <BinaryToggle
              isActive={isSwipeMode}
              onClick={onToggleSwipeMode}
              activeLabel="Swipe"
              inactiveLabel="Tap"
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
        <TournamentButton
          onClick={startTournamentButton.onClick}
          disabled={!isReady}
          className={styles.startButton}
          ariaLabel={buttonLabel}
          startIcon={isReady ? undefined : null}
        >
          {buttonLabel}
        </TournamentButton>
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
