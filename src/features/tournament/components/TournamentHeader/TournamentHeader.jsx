/**
 * @module TournamentSetup/components/TournamentHeader
 * @description Header section for tournament setup with title, actions, and stats
 */
import PropTypes from "prop-types";
import HeaderActions from "./HeaderActions";
import NameCounter from "./NameCounter";
import AdminStats from "./AdminStats";
import styles from "../../TournamentSetup.module.css";

function TournamentHeader({
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
  return (
    <div className={styles.panelHeader}>
      <div className={styles.headerRow}>
        <HeaderActions
          selectedNamesCount={selectedNames.length}
          availableNamesCount={availableNames.length}
          onSelectAll={onSelectAll}
          isSwipeMode={isSwipeMode}
          onSwipeModeToggle={onSwipeModeToggle}
          showCatPictures={showCatPictures}
          onCatPicturesToggle={onCatPicturesToggle}
          selectedNames={selectedNames}
          onStart={onStart}
        />
      </div>

      <NameCounter selectedNamesCount={selectedNames.length} />

      {/* Admin-only enhanced statistics */}
      {isAdmin && <AdminStats availableNames={availableNames} />}
    </div>
  );
}

TournamentHeader.propTypes = {
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  availableNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectAll: PropTypes.func.isRequired,
  isSwipeMode: PropTypes.bool.isRequired,
  onSwipeModeToggle: PropTypes.func.isRequired,
  showCatPictures: PropTypes.bool.isRequired,
  onCatPicturesToggle: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

export default TournamentHeader;
