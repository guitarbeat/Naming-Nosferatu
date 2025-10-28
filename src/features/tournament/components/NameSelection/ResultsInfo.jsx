/**
 * @module TournamentSetup/components/ResultsInfo
 * @description Display results count and filter info for admin users
 */
import PropTypes from "prop-types";
import styles from "../../TournamentSetup.module.css";

function ResultsInfo({
  displayCount,
  totalCount,
  selectedCategory,
  searchTerm,
}) {
  return (
    <div className={styles.resultsInfo}>
      <span className={styles.resultsCount}>
        Showing {displayCount} of {totalCount} names
        {selectedCategory && ` in "${selectedCategory}" category`}
        {searchTerm && ` matching "${searchTerm}"`}
      </span>
    </div>
  );
}

ResultsInfo.propTypes = {
  displayCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  selectedCategory: PropTypes.string,
  searchTerm: PropTypes.string,
};

export default ResultsInfo;

