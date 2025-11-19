/**
 * @module TournamentSetup/components/NameCounter
 * @description Display count of selected names with helpful messages
 */
import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import styles from "../../TournamentSetup.module.css";

function NameCounter({ selectedNamesCount }) {
  // Don't render when no names are selected
  if (selectedNamesCount === 0) {
    return null;
  }

  return (
    <Card
      className={styles.nameCount}
      padding="small"
      shadow="medium"
      background="glass"
      as="section"
      aria-live="polite"
    >
      <span className={styles.countText}>
        {`${selectedNamesCount} Names Selected`}
      </span>

      {selectedNamesCount === 1 && (
        <span className={styles.helperText} role="alert">
          Just one more to start! 🎯
        </span>
      )}
    </Card>
  );
}

NameCounter.propTypes = {
  selectedNamesCount: PropTypes.number.isRequired,
};

export default NameCounter;
