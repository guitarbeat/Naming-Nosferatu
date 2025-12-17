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

export default memo(Button);
