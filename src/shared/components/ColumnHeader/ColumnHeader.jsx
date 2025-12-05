/**
 * @module ColumnHeader
 * @description Reusable table column header with optional sorting and metric explanation
 */

import PropTypes from 'prop-types';
import { MetricExplainer, InfoIcon } from '../MetricExplainer';
import './ColumnHeader.css';

/**
 * ColumnHeader Component
 * Renders a sortable table header with optional metric explanation
 *
 * @param {Object} props
 * @param {string} props.label - Header label text
 * @param {string} props.metricName - Name of the metric (for explanation)
 * @param {boolean} props.sortable - Whether this column is sortable
 * @param {boolean} props.sorted - Whether this column is currently sorted
 * @param {string} props.sortDirection - Current sort direction: 'asc' or 'desc'
 * @param {Function} props.onSort - Callback when sort is clicked: (field, direction) => void
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ColumnHeader({
  label,
  metricName,
  sortable = true,
  sorted = false,
  sortDirection = 'desc',
  onSort,
  className = '',
}) {
  const handleSort = () => {
    if (!sortable || !onSort) return;

    // Toggle direction if already sorted by this column
    const newDirection = sorted && sortDirection === 'desc' ? 'asc' : 'desc';
    onSort(metricName, newDirection);
  };

  const headerClass = `
    column-header
    ${sortable ? 'column-header-sortable' : ''}
    ${sorted ? 'column-header-sorted' : ''}
    ${className}
  `.trim();

  const content = (
    <div className={headerClass}>
      <div className="column-header-label">
        <span className="column-header-text">{label}</span>

        {/* Sort indicator */}
        {sortable && sorted && (
          <span className="column-header-sort-indicator" aria-hidden="true">
            {sortDirection === 'desc' ? '▼' : '▲'}
          </span>
        )}
      </div>

      {/* Metric explanation icon */}
      {metricName && (
        <MetricExplainer metricName={metricName} placement="bottom">
          <InfoIcon />
        </MetricExplainer>
      )}
    </div>
  );

  if (!sortable) {
    return content;
  }

  return (
    <button
      className={`${headerClass} column-header-button`}
      onClick={handleSort}
      aria-sort={
        sorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      type="button"
    >
      {content}
    </button>
  );
}

ColumnHeader.propTypes = {
  label: PropTypes.string.isRequired,
  metricName: PropTypes.string,
  sortable: PropTypes.bool,
  sorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func,
  className: PropTypes.string,
};

ColumnHeader.displayName = 'ColumnHeader';

export default ColumnHeader;
