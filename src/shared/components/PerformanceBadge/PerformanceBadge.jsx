/**
 * @module PerformanceBadge
 * @description Component to display achievement/status badges for names
 */

import PropTypes from "prop-types";
import { getInsightCategory } from "../../utils/metricDefinitions";
import "./PerformanceBadge.css";

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
export function PerformanceBadge({
  type,
  label,
  variant = "md",
  className = "",
}) {
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

export default PerformanceBadge;
