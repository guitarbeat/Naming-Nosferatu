/**
 * @module TournamentSetup/components/TournamentInfo
 * @description Tournament overview information card
 */
import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import styles from "../../TournamentSetup.module.css";

function TournamentInfo({ selectedNamesCount, availableNamesCount }) {
  return (
    <Card
      className={styles.sidebarCard}
      padding="large"
      shadow="large"
      as="section"
      aria-labelledby="tournament-setup-overview"
    >
      <div className={styles.tournamentHeader}>
        <h1 id="tournament-setup-overview" className={styles.tournamentTitle}>
          🏆 Cat Name Tournament
        </h1>
        <p className={styles.tournamentSubtitle}>
          Pick the perfect name for your cat through fun head-to-head battles!
        </p>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.max((selectedNamesCount / Math.max(availableNamesCount, 1)) * 100, 5)}%`,
            }}
          />
        </div>
        <span className={styles.progressText}>
          {selectedNamesCount} of {availableNamesCount} names selected
        </span>
      </div>
    </Card>
  );
}

TournamentInfo.propTypes = {
  selectedNamesCount: PropTypes.number.isRequired,
  availableNamesCount: PropTypes.number.isRequired,
};

export default TournamentInfo;
