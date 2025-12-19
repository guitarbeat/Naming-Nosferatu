/**
 * @module PerformanceBadge
 * @description Component to display achievement/status badges for names
 */

import PropTypes from "prop-types";
import { getInsightCategory } from "../../utils/metricsUtils";
import "./PerformanceBadge.css";
import "./TrendIndicator.css";

/**
 * PerformanceBadge Component
 * Displays visual badge indicating achievement or status
 *
 * @param {Object} props
 * @param {string} props.type - Badge type (e.g., 'top_rated', 'trending_up', 'new', 'undefeated', etc.)
 * @param {string} props.label - Custom label (overrides default from type)
 * @param {string} props.variant - Size variant: 'sm' (compact) or 'md' (default)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
interface PerformanceBadgeProps {
  type: string;
  label?: string;
  variant?: "sm" | "md";
  className?: string;
}

export function PerformanceBadge({
  type,
  label,
  variant = "md",
  className = "",
}: PerformanceBadgeProps) {
  const category = getInsightCategory(type);

  if (!category && !label) {
    return null;
  }

  const badgeLabel = label || category?.label || type;
  const badgeIcon = category?.icon || "•";
  const badgeDescription = category?.description || "";
  const badgeClass =
    `performance-badge performance-badge-${type} performance-badge-${variant} ${className}`.trim();

  return (
    <span
      className={badgeClass}
      title={badgeDescription}
      aria-label={`${badgeLabel}: ${badgeDescription}`}
      role="status"
    >
      <span className="badge-icon" aria-hidden="true">
        {badgeIcon}
      </span>
      <span className="badge-label">{badgeLabel}</span>
    </span>
  );
}

PerformanceBadge.propTypes = {
  type: PropTypes.string.isRequired,
  label: PropTypes.string,
  variant: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
};

PerformanceBadge.displayName = "PerformanceBadge";

/**
 * Multiple Performance Badges Component
 * Renders multiple badges in a container
 *
 * @param {Object} props
 * @param {string[]} props.types - Array of badge types
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function PerformanceBadges({ types = [], className = "" }) {
  if (!types || types.length === 0) {
    return null;
  }

  return (
    <div className={`performance-badges ${className}`.trim()}>
      {types.map((type) => (
        <PerformanceBadge key={type} type={type} variant="sm" />
      ))}
    </div>
  );
}

PerformanceBadges.propTypes = {
  types: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

PerformanceBadges.displayName = "PerformanceBadges";

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
