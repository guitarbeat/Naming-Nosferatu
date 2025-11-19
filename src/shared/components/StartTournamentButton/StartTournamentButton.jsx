import React from "react";
import PropTypes from "prop-types";
import Button from "../Button";
import styles from "./StartTournamentButton.module.css";

const DEFAULT_LABEL = "Start New Tournament";

const PlusIcon = () => (
  <svg
    className={styles.iconSvg}
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M12 4v16m8-8H4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function StartTournamentButton({
  children = DEFAULT_LABEL,
  variant = "primary",
  size = "medium",
  className = "",
  startIcon,
  endIcon,
  ariaLabel,
  ...rest
}) {
  const { ["aria-label"]: ariaLabelFromRest, ...buttonProps } = rest;
  const computedLabel =
    ariaLabel ??
    ariaLabelFromRest ??
    (typeof children === "string" ? children : DEFAULT_LABEL);

  const resolvedStartIcon =
    startIcon === null ? null : startIcon !== undefined ? (
      startIcon
    ) : (
      <span className={styles.iconWrapper} aria-hidden="true">
        <PlusIcon />
      </span>
    );

  return (
    <Button
      variant={variant}
      size={size}
      className={`${styles.startTournamentButton} ${className}`.trim()}
      startIcon={resolvedStartIcon}
      endIcon={endIcon}
      aria-label={computedLabel}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}

StartTournamentButton.displayName = "StartTournamentButton";

StartTournamentButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  className: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  ariaLabel: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

export default StartTournamentButton;
