/**
 * @module AnalysisPanel/components/AnalysisHighlights
 * @description Highlights section for top items
 */

import PropTypes from "prop-types";

/**
 * Highlights section for top items
 * @param {Object} props
 * @param {Array} props.highlights - Array of highlight groups
 */
export function AnalysisHighlights({ highlights }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="analysis-highlights">
      {highlights.map((group) => (
        <div key={group.title} className="analysis-highlight">
          <h3 className="analysis-highlight-title">{group.title}</h3>
          <ul className="analysis-highlight-list">
            {group.items.slice(0, 5).map((item) => (
              <li key={item.id} className="analysis-highlight-item">
                <span className="analysis-highlight-name">{item.name}</span>
                <span className="analysis-highlight-value">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

AnalysisHighlights.propTypes = {
  highlights: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          name: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        }),
      ).isRequired,
    }),
  ),
};

export default AnalysisHighlights;

