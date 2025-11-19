/**
 * @module TournamentSetup/StartButton
 * @description Start tournament button with validation
 */

import PropTypes from "prop-types";
import { validateCatName } from "../../../shared/utils/validationUtils";
import { StartTournamentButton } from "../../../shared/components";
import styles from "../TournamentSetup.module.css";

function StartButton({ selectedNames, onStart, variant = "default" }) {
  const validateNames = (names) => {
    return names.every((nameObj) => {
      if (!nameObj || typeof nameObj !== "object" || !nameObj.id) {
        return false;
      }

      // * Validate the name using our validation utility
      const nameValidation = validateCatName(nameObj.name);
      if (!nameValidation.success) {
        console.warn(
          "Invalid name detected:",
          nameObj.name,
          nameValidation.error,
        );
        return false;
      }

      return true;
    });
  };

  const handleStart = () => {
    console.log(
      "[DEV] 🎮 StartButton: handleStart called with selectedNames:",
      selectedNames,
    );

    if (!validateNames(selectedNames)) {
      console.error("Invalid name objects detected:", selectedNames);
      return;
    }

    console.log(
      "[DEV] 🎮 StartButton: Calling onStart with validated names:",
      selectedNames,
    );
    onStart(selectedNames);
  };

  const buttonText =
    selectedNames.length < 2
      ? `Need ${2 - selectedNames.length} More Name${selectedNames.length === 0 ? "s" : ""} 🎯`
      : "Start Tournament! 🏆";

  const buttonClass =
    variant === "header" ? styles.startButtonHeader : styles.startButton;
  const isReady = selectedNames.length >= 2;

  return (
    <StartTournamentButton
      onClick={handleStart}
      className={buttonClass}
      disabled={!isReady}
      ariaLabel={
        isReady ? "Start Tournament" : "Select at least 2 names to start"
      }
      size={variant === "header" ? "medium" : "large"}
      startIcon={isReady ? undefined : null}
    >
      {buttonText}
    </StartTournamentButton>
  );
}

StartButton.propTypes = {
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onStart: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["default", "header"]),
};

export default StartButton;
