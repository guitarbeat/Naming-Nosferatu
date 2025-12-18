/**
 * @module MatchResult
 * @description Component that displays the result of a tournament match.
 * Shows which name won or if the match was skipped.
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./MatchResult.module.css";

interface MatchResultProps {
  showMatchResult: boolean;
  lastMatchResult: string | null;
  roundNumber: number;
  currentMatchNumber: number;
  totalMatches: number;
}

/**
 * MatchResult component
 * @param {Object} props - Component props
 * @param {boolean} props.showMatchResult - Whether to show the match result
 * @param {string|null} props.lastMatchResult - The result message to display
 * @param {number} props.roundNumber - Current round number
 * @param {number} props.currentMatchNumber - Current match number
 * @param {number} props.totalMatches - Total number of matches
 * @returns {JSX.Element|null} The match result component or null
 */
function MatchResult({
  showMatchResult,
  lastMatchResult,
  roundNumber,
  currentMatchNumber,
  totalMatches,
}: MatchResultProps) {
  if (!showMatchResult || !lastMatchResult) return null;

  return (
    <div className={styles.matchResult} role="status" aria-live="polite">
      <div className={styles.resultContent}>
        <span className={styles.resultMessage}>{lastMatchResult}</span>
        <span className={styles.tournamentProgress}>
          Round {roundNumber} - Match {currentMatchNumber} of {totalMatches}
        </span>
      </div>
    </div>
  );
}

MatchResult.propTypes = {
  showMatchResult: PropTypes.bool.isRequired,
  lastMatchResult: PropTypes.string,
  roundNumber: PropTypes.number.isRequired,
  currentMatchNumber: PropTypes.number.isRequired,
  totalMatches: PropTypes.number.isRequired,
};

MatchResult.displayName = "MatchResult";

export default MatchResult;
