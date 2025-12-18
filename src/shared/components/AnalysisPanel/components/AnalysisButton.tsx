/**
 * @module AnalysisPanel/components/AnalysisButton
 * @description Button component for Analysis Mode
 */

import PropTypes from "prop-types";

/**
 * Button component for Analysis Mode
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant: 'default' | 'primary' | 'danger' | 'ghost'
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.className - Additional CSS classes
 */
export function AnalysisButton({
  children,
  variant = "default",
  onClick,
  disabled = false,
  ariaLabel,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`analysis-btn ${variant !== "default" ? `analysis-btn--${variant}` : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

AnalysisButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "primary", "danger", "ghost"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};
