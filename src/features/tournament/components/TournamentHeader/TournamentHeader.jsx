/**
 * @module Tournament/components/TournamentHeader
 * @description Header component for tournament view with progress information
 */

import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import styles from "../../Tournament.module.css";

function TournamentHeader({ roundNumber, currentMatchNumber, totalMatches, progress }) {
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
  roundNumber: PropTypes.number.isRequired,
  currentMatchNumber: PropTypes.number.isRequired,
  totalMatches: PropTypes.number.isRequired,
  progress: PropTypes.number.isRequired,
};

export default TournamentHeader;
