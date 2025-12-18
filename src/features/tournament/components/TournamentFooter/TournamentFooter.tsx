/**
 * @module Tournament/components/TournamentFooter
 * @description Footer component for tournament view with controls, keyboard help, and bracket view
 */

import PropTypes from "prop-types";
import Bracket from "../../../../shared/components/Bracket/Bracket";
import styles from "../../Tournament.module.css";

interface TournamentFooterProps {
  showBracket: boolean;
  showKeyboardHelp: boolean;
  transformedMatches: unknown[];
  onToggleBracket: () => void;
  onToggleKeyboardHelp: () => void;
}

function TournamentFooter({
  showBracket,
  showKeyboardHelp,
  transformedMatches,
  onToggleBracket,
  onToggleKeyboardHelp,
}: TournamentFooterProps) {
  return (
    <>
      {/* Tournament Controls */}
      <div className={styles.tournamentControls}>
        <button
          className={styles.bracketToggle}
          onClick={onToggleBracket}
          aria-expanded={showBracket}
          aria-controls="bracketView"
        >
          {showBracket ? "Hide Tournament History" : "Show Tournament History"}
          <span className={styles.bracketToggleIcon}>
            {showBracket ? "▼" : "▶"}
          </span>
        </button>

        <button
          className={styles.keyboardHelpToggle}
          onClick={onToggleKeyboardHelp}
          aria-expanded={showKeyboardHelp}
          aria-controls="keyboardHelp"
          type="button"
        >
          <span className={styles.keyboardIcon}>⌨️</span>
          Keyboard Shortcuts
          <span className={styles.keyboardHelpIcon}>
            {showKeyboardHelp ? "▼" : "▶"}
          </span>
        </button>
      </div>

      {/* Keyboard Help */}
      {showKeyboardHelp && (
        <div
          id="keyboardHelp"
          className={styles.keyboardHelp}
          role="complementary"
          aria-label="Keyboard shortcuts help"
        >
          <h3>Keyboard Shortcuts</h3>
          <ul>
            <li>
              <kbd>←</kbd> Select left name
            </li>
            <li>
              <kbd>→</kbd> Select right name
            </li>
            <li>
              <kbd>↑</kbd> Vote for both names
            </li>
            <li>
              <kbd>↓</kbd> Skip this match
            </li>
            <li>
              <kbd>Space</kbd> or <kbd>Enter</kbd> Vote for selected name
            </li>
            <li>
              <kbd>Escape</kbd> Clear selection
            </li>
            <li>
              <kbd>Tab</kbd> Navigate between elements
            </li>
            <li>
              <kbd>C</kbd> Toggle cat pictures
            </li>
          </ul>
        </div>
      )}

      {/* Bracket View */}
      {showBracket && (
        <div
          id="bracketView"
          className={styles.bracketView}
          role="complementary"
          aria-label="Tournament bracket history"
        >
          <Bracket matches={transformedMatches} />
        </div>
      )}
    </>
  );
}

TournamentFooter.propTypes = {
  showBracket: PropTypes.bool.isRequired,
  showKeyboardHelp: PropTypes.bool.isRequired,
  transformedMatches: PropTypes.array.isRequired,
  onToggleBracket: PropTypes.func.isRequired,
  onToggleKeyboardHelp: PropTypes.func.isRequired,
};

export default TournamentFooter;
