import PropTypes from "prop-types";
import styles from "./FilterGroup.module.css";

/**
 * FilterGroup Component
 * Reusable wrapper for filter controls with consistent styling
 */
const FilterGroup = ({ label, children, className = "" }) => {
  const classNames = `${styles.filterGroup} ${className}`.trim();

  return (
    <div className={classNames}>
      {label && <label className={styles.filterLabel}>{label}</label>}
      {children}
    </div>
  );
};

FilterGroup.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

FilterGroup.defaultProps = {
  label: "",
  className: "",
};

export default FilterGroup;
