/**
 * @module Button
 * @description Unified button component system using shadcn/ui.
 * Provides consistent styling, accessibility, and behavior across the app.
 * This component wraps the shadcn Button and provides a consistent API.
 */

import React, { memo } from "react";
import PropTypes from "prop-types";
import { Loader2 } from "lucide-react";
import { Button as ShadcnButton } from "../ui/button";

const variantMapping = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
  ghost: "ghost",
  login: "login",
};

const sizeMapping = {
  small: "sm",
  medium: "default",
  large: "lg",
};

export const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "danger",
  "ghost",
  "login",
];
export const BUTTON_SIZES = ["small", "medium", "large"];

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  type = "button",
  className = "",
  onClick,
  startIcon = null,
  endIcon = null,
  iconOnly = false,
  ...rest
}) => {
  const shadcnVariant = variantMapping[variant] || "default";
  let shadcnSize = sizeMapping[size] || "default";

  if (iconOnly) {
    shadcnSize = "icon";
  }

  const handleClick = (event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <ShadcnButton
      type={type}
      variant={shadcnVariant}
      size={shadcnSize}
      disabled={disabled || loading}
      className={className}
      onClick={handleClick}
      {...rest}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {startIcon && !loading && <span className="mr-2">{startIcon}</span>}
      {!iconOnly && children}
      {iconOnly && !startIcon && !loading && children}
      {endIcon && !loading && <span className="ml-2">{endIcon}</span>}
    </ShadcnButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(BUTTON_VARIANTS),
  size: PropTypes.oneOf(BUTTON_SIZES),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  className: PropTypes.string,
  onClick: PropTypes.func,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  iconOnly: PropTypes.bool,
};

Button.displayName = "Button";

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
  variant: PropTypes.oneOf(BUTTON_VARIANTS),
  size: PropTypes.oneOf(BUTTON_SIZES),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
};

IconButton.displayName = "IconButton";

export default memo(Button);
export { IconButton };
