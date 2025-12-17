import PropTypes from "prop-types";
import Select from "../Form/Select";
import { styles } from "./styles";

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div className={styles.filterGroup}>
      <label htmlFor={id} className={styles.filterLabel}>
        {label}
      </label>
      <Select
        id={id}
        name={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        options={options}
        className={styles.filterSelect}
      />
    </div>
  );
}

FilterSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default FilterSelect;
