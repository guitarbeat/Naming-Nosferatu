/**
 * @module TrendIndicator
 * @description Component to display trend indicators (up/down arrows with percentage change)
 */

import PropTypes from "prop-types";
import "./TrendIndicator.css";

/**
 * TrendIndicator Component
 * Shows visual indication of trend (up/down/stable) with percentage change
 *
 * @param {Object} props
 * @param {string} props.direction - Trend direction: 'up', 'down', or 'stable'
 * @param {number} props.percentChange - Percentage change value
 * @param {boolean} props.compact - If true, show compact version (icon only)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animated - If true, add animation on mount
 * @returns {JSX.Element}
 */
export function TrendIndicator({
  direction = "stable",
  percentChange = 0,
  compact = false,
  className = "",
  animated = true,
}) {
  const trendClass =
    `trend-indicator trend-${direction} ${animated ? "trend-animated" : ""} ${className}`.trim();

  const renderIcon = () => {
    switch (direction) {
      case "up":
        return (
          <span className="trend-icon" aria-hidden="true">
            📈
          </span>
        );
      case "down":
        return (
          <span className="trend-icon" aria-hidden="true">
            📉
          </span>
        );
      default:
        return (
          <span className="trend-icon" aria-hidden="true">
            ➡️
          </span>
        );
    }
  };

  const ariaLabel = `${direction === "up" ? "Trending up" : direction === "down" ? "Trending down" : "Stable"} ${percentChange ? `by ${percentChange}%` : ""}`;

  if (compact) {
    return (
      <span className={trendClass} title={ariaLabel} aria-label={ariaLabel}>
        {renderIcon()}
      </span>
    );
  }

  return (
    <span className={trendClass} title={ariaLabel} aria-label={ariaLabel}>
      {renderIcon()}
      {percentChange !== 0 && (
        <span className="trend-value">
          {direction === "up" ? "+" : direction === "down" ? "−" : ""}
          {percentChange}%
        </span>
      )}
    </span>
  );
}

TrendIndicator.propTypes = {
  direction: PropTypes.oneOf(["up", "down", "stable"]),
  percentChange: PropTypes.number,
  compact: PropTypes.bool,
  className: PropTypes.string,
  animated: PropTypes.bool,
};

TrendIndicator.displayName = "TrendIndicator";

export default TrendIndicator;
