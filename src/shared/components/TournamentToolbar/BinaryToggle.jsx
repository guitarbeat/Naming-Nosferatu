import PropTypes from "prop-types";
import { styles } from "./styles";

function BinaryToggle({
  isActive,
  onClick,
  activeLabel,
  inactiveLabel,
  ariaLabel,
}) {
  return (
    <div className={styles.toggleWrapper}>
      <button
        type="button"
        onClick={onClick}
        className={`${styles.toggleSwitch} ${
          isActive ? styles.toggleSwitchActive : ""
        }`}
        aria-label={ariaLabel}
        aria-pressed={isActive}
        role="switch"
      >
        <span className={styles.toggleLabel} data-position="left">
          {inactiveLabel}
        </span>
        <span className={styles.toggleThumb} data-active={isActive} />
        <span className={styles.toggleLabel} data-position="right">
          {activeLabel}
        </span>
      </button>
    </div>
  );
}

BinaryToggle.propTypes = {
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  activeLabel: PropTypes.string.isRequired,
  inactiveLabel: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

export default BinaryToggle;
