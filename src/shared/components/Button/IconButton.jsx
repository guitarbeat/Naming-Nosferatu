/**
 * @module IconButton
 * @description Icon-only button component for consistent icon button styling.
 * Wraps the Button component with icon-only configuration.
 */

import React from "react";
import PropTypes from "prop-types";
import Button from "./Button";

/**
 * IconButton component for icon-only buttons
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon element to display
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Accessibility label (required for icon buttons)
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} IconButton component
 */
const IconButton = ({
  icon,
  variant = "ghost",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ariaLabel,
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      className={className}
      iconOnly={true}
      aria-label={ariaLabel}
      {...rest}
    >
      {icon}
    </Button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "danger",
    "ghost",
    "login",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
};

IconButton.displayName = "IconButton";

export default IconButton;

