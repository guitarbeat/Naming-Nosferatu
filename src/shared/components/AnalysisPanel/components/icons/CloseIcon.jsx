/**
 * @module AnalysisPanel/components/icons/CloseIcon
 * @description Close/X icon SVG component for analysis mode
 */

import PropTypes from "prop-types";

/**
 * Close icon SVG component
 * @param {Object} props
 * @param {number} props.width - Icon width (default: 16)
 * @param {number} props.height - Icon height (default: 16)
 * @param {string} props.className - Additional CSS classes
 */
export function CloseIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

CloseIcon.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
};

export default CloseIcon;

