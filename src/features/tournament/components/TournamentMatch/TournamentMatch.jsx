/**
 * @module Tournament/components/TournamentMatch
 * @description Component for displaying the current tournament match with two NameCards
 */

import PropTypes from "prop-types";
import { Card, Error } from "../../../../shared/components";
import NameCard from "../../../../shared/components/NameCard/NameCard";
import styles from "../../Tournament.module.css";

function TournamentMatch({
  currentMatch,
  selectedOption,
  isProcessing,
  isTransitioning,
  votingError,
  onNameCardClick,
  onVoteWithAnimation,
  onVoteRetry,
  onDismissError,
}) {
  return (
    <Card
      className={styles.matchup}
      background="glass"
      padding="none"
      shadow="medium"
      role="region"
      aria-label="Current matchup"
      aria-busy={isTransitioning || isProcessing}
    >
      <div className={styles.namesRow}>
        <div
          className={`${styles.nameContainer} ${selectedOption === "left" ? styles.selected : ""}`}
          role="group"
          aria-label="Left name option"
        >
          <NameCard
            name={currentMatch.left?.name || "Unknown"}
            description={currentMatch.left?.description || ""}
            onClick={() => onNameCardClick("left")}
            selected={selectedOption === "left"}
            disabled={isProcessing || isTransitioning}
            shortcutHint="Press ← arrow key"
            size="medium"
          />
        </div>

        <div className={styles.vsSection} aria-hidden="true">
          <span className={styles.vsText}>vs</span>
        </div>

        <div
          className={`${styles.nameContainer} ${selectedOption === "right" ? styles.selected : ""}`}
          role="group"
          aria-label="Right name option"
        >
          <NameCard
            name={currentMatch.right?.name || "Unknown"}
            description={currentMatch.right?.description || ""}
            onClick={() => onNameCardClick("right")}
            selected={selectedOption === "right"}
            disabled={isProcessing || isTransitioning}
            shortcutHint="Press → arrow key"
            size="medium"
          />
        </div>
      </div>

      {/* Extra Voting Options */}
      <div
        className={styles.extraOptions}
        role="group"
        aria-label="Additional voting options"
      >
        <button
          className={`${styles.extraOptionsButton} ${selectedOption === "both" ? styles.selected : ""}`}
          onClick={() => onVoteWithAnimation("both")}
          disabled={isProcessing || isTransitioning}
          aria-pressed={selectedOption === "both"}
          aria-label="Vote for both names (Press Up arrow key)"
          type="button"
        >
          I Like Both!{" "}
          <span className={styles.shortcutHint} aria-hidden="true">
            (↑ Up)
          </span>
        </button>

        <button
          className={`${styles.extraOptionsButton} ${selectedOption === "neither" ? styles.selected : ""}`}
          onClick={() => onVoteWithAnimation("neither")}
          disabled={isProcessing || isTransitioning}
          aria-pressed={selectedOption === "neither"}
          aria-label="Skip this match (Press Down arrow key)"
          type="button"
        >
          Skip{" "}
          <span className={styles.shortcutHint} aria-hidden="true">
            (↓ Down)
          </span>
        </button>
      </div>

      {/* Voting Error Display */}
      {votingError && (
        <Error
          variant="inline"
          error={votingError}
          context="vote"
          position="below"
          onRetry={onVoteRetry}
          onDismiss={onDismissError}
          showRetry={true}
          showDismiss={true}
          size="medium"
          className={styles.votingError}
        />
      )}
    </Card>
  );
}

TournamentMatch.propTypes = {
  currentMatch: PropTypes.shape({
    left: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
    }),
    right: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
    }),
  }).isRequired,
  selectedOption: PropTypes.oneOf(["left", "right", "both", "neither", null]),
  isProcessing: PropTypes.bool.isRequired,
  isTransitioning: PropTypes.bool.isRequired,
  votingError: PropTypes.object,
  onNameCardClick: PropTypes.func.isRequired,
  onVoteWithAnimation: PropTypes.func.isRequired,
  onVoteRetry: PropTypes.func.isRequired,
  onDismissError: PropTypes.func.isRequired,
};

export default TournamentMatch;
