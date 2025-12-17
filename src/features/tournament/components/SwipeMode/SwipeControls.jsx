import PropTypes from "prop-types";
import styles from "../../TournamentSetup.module.css";

function SwipeControls({
  onSwipeLeft,
  onSwipeRight,
  currentIndex = 0,
  totalCount = 0,
}) {
  return (
    <div
      className={styles.swipeControls}
      role="group"
      aria-label="Swipe controls"
    >
      <button
        type="button"
        onClick={onSwipeLeft}
        className={styles.swipeButton}
        aria-label="Swipe left"
      >
        ⬅️ Skip
      </button>
      <div className={styles.swipeProgressLabel}>
        {currentIndex + 1} / {totalCount || "?"}
      </div>
      <button
        type="button"
        onClick={onSwipeRight}
        className={styles.swipeButton}
        aria-label="Swipe right"
      >
        ➡️ Select
      </button>
    </div>
  );
}

SwipeControls.propTypes = {
  onSwipeLeft: PropTypes.func.isRequired,
  onSwipeRight: PropTypes.func.isRequired,
  currentIndex: PropTypes.number,
  totalCount: PropTypes.number,
};

export default SwipeControls;
