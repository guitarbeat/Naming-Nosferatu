/**
 * @module RoundTransition
 * @description Component that displays a transition animation between tournament rounds.
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./RoundTransition.module.css";

interface RoundTransitionProps {
  showRoundTransition: boolean;
  nextRoundNumber: number | null;
}

/**
 * RoundTransition component
 * @param {Object} props - Component props
 * @param {boolean} props.showRoundTransition - Whether to show the round transition
 * @param {number|null} props.nextRoundNumber - The next round number to display
 * @returns {JSX.Element|null} The round transition component or null
 */
function RoundTransition({ showRoundTransition, nextRoundNumber }: RoundTransitionProps) {
  if (!showRoundTransition || !nextRoundNumber) return null;

  return (
    <div className={styles.roundTransition} role="status" aria-live="polite">
      <div className={styles.transitionContent}>
        <div className={styles.roundIcon}>🏆</div>
        <h2 className={styles.roundTitle}>Round {nextRoundNumber}</h2>
        <p className={styles.roundSubtitle}>Tournament continues...</p>
      </div>
    </div>
  );
}

RoundTransition.propTypes = {
  showRoundTransition: PropTypes.bool.isRequired,
  nextRoundNumber: PropTypes.number,
};

RoundTransition.displayName = "RoundTransition";

// ts-prune-ignore-next (used in Tournament)
export default RoundTransition;
