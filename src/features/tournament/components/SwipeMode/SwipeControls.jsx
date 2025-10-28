/**
 * @module TournamentSetup/components/SwipeControls
 * @description Swipe control buttons and progress indicator
 */
import PropTypes from "prop-types";
import styles from "../../TournamentSetup.module.css";

function SwipeControls({ onSwipeLeft, onSwipeRight, currentIndex, totalCount }) {
  return (
    <div className={styles.swipeButtons}>
      <button
        onClick={onSwipeLeft}
        className={`${styles.swipeButton} ${styles.swipeLeftButton}`}
      >
        👎 Skip
      </button>

      <div className={styles.cardProgress}>
        {currentIndex + 1} of {totalCount}
      </div>

      <button
        onClick={onSwipeRight}
        className={`${styles.swipeButton} ${styles.swipeRightButton}`}
      >
        👍 Select
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

