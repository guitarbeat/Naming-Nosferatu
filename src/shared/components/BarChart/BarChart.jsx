/**
 * @module BarChart
 * @description Simple CSS-based horizontal bar chart component.
 * Lightweight alternative to charting libraries for basic visualizations.
 */

import PropTypes from "prop-types";
import "./BarChart.css";

/**
 * Simple horizontal bar chart
 * @param {Object} props
 * @param {string} props.title - Chart title
 * @param {Array} props.items - Array of data items
 * @param {string} props.valueKey - Key for the value field (default: "value")
 * @param {string} props.labelKey - Key for the label field (default: "name")
 * @param {number} props.maxItems - Maximum items to display (default: 5)
 * @param {boolean} props.showSecondaryValue - Show secondary value in parentheses
 * @param {string} props.secondaryValueKey - Key for secondary value (default: "avg_rating")
 * @param {string} props.className - Additional CSS classes
 */
export function BarChart({
  title,
  items,
  valueKey = "value",
  labelKey = "name",
  maxItems = 5,
  showSecondaryValue = false,
  secondaryValueKey = "avg_rating",
  className = "",
}) {
  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, maxItems);
  const maxValue = Math.max(...displayItems.map((item) => item[valueKey] || 0), 1);

  return (
    <div className={`bar-chart ${className}`}>
      {title && <h3 className="bar-chart-title">{title}</h3>}
      <div className="bar-chart-bars">
        {displayItems.map((item, index) => (
          <div key={item.id || index} className="bar-chart-row">
            <div className="bar-chart-label" title={item[labelKey]}>
              {item[labelKey]}
            </div>
            <div className="bar-chart-bar-container">
              <div
                className="bar-chart-bar"
                style={{
                  width: `${((item[valueKey] || 0) / maxValue) * 100}%`,
                }}
              />
            </div>
            <div className="bar-chart-value">
              {showSecondaryValue && item[secondaryValueKey] ? (
                <span title={`${secondaryValueKey}: ${item[secondaryValueKey]}`}>
                  {item[valueKey]} <small>({item[secondaryValueKey]})</small>
                </span>
              ) : (
                item[valueKey]
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

BarChart.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  maxItems: PropTypes.number,
  showSecondaryValue: PropTypes.bool,
  secondaryValueKey: PropTypes.string,
  className: PropTypes.string,
};

export default BarChart;
