/**
 * @module AnalysisPanel/components/icons/SearchIcon
 * @description Search icon SVG component for analysis mode
 */

import PropTypes from "prop-types";

/**
 * Search icon SVG component
 * @param {Object} props
 * @param {number} props.width - Icon width (default: 16)
 * @param {number} props.height - Icon height (default: 16)
 * @param {string} props.className - Additional CSS classes
 */
export function SearchIcon({ width = 16, height = 16, className = "" }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

SearchIcon.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
};

export default SearchIcon;
