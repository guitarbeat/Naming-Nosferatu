import PropTypes from "prop-types";
import styles from "../../TournamentSetup.module.css";

function SwipeControls({
  onSwipeLeft,
  onSwipeRight,
  currentIndex,
  totalCount,
}) {
  return (
    <div
      className={styles.swipeButtons}
      role="group"
      aria-label="Swipe controls"
    >
      <button
        type="button"
        className={`${styles.swipeButton} ${styles.swipeLeftButton}`}
        onClick={onSwipeLeft}
        aria-label="Reject name"
      >
        ❌ Reject
      </button>
      <div className={styles.cardProgress}>
        {currentIndex + 1} / {totalCount}
      </div>
      <button
        type="button"
        className={`${styles.swipeButton} ${styles.swipeRightButton}`}
        onClick={onSwipeRight}
        aria-label="Accept name"
      >
        ✅ Accept
      </button>
    </div>
  );
}

SwipeControls.propTypes = {
  onSwipeLeft: PropTypes.func.isRequired,
  onSwipeRight: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
};

export default SwipeControls;
