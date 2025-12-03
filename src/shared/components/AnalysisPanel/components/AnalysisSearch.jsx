/**
 * @module AnalysisPanel/components/AnalysisSearch
 * @description Search input with icon
 */

import PropTypes from "prop-types";
import { SearchIcon } from "./icons";

/**
 * Search input with icon
 * @param {Object} props
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 */
export function AnalysisSearch({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="analysis-search analysis-filter">
      <span className="analysis-search-icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="analysis-input analysis-search-input"
        aria-label="Search"
      />
    </div>
  );
}

AnalysisSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default AnalysisSearch;
