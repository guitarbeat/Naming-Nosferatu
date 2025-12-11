import PropTypes from "prop-types";

/**
 * SortOrderIcon - Accessible SVG icon for sort order indicator
 */
function SortOrderIcon({ direction = "asc", className = "" }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {direction === "asc" ? (
        <path
          d="M8 4L4 8H7V12H9V8H12L8 4Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8 12L12 8H9V4H7V8H4L8 12Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

SortOrderIcon.propTypes = {
  direction: PropTypes.oneOf(["asc", "desc"]).isRequired,
  className: PropTypes.string,
};

export default SortOrderIcon;
