/**
 * @module Select
 * @description Unified select component with built-in error states and validation.
 * Standardizes select styling and behavior across the app.
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./Form.module.css";

/**
 * Select component with built-in error handling
 * @param {Object} props - Component props
 * @param {string} props.name - Select name
 * @param {string} props.value - Select value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {Array} props.options - Select options
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {boolean} props.required - Whether select is required
 * @param {string} props.error - Error message
 * @param {string} props.label - Select label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaDescribedBy - Space separated IDs for aria-describedby
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} Select component
 */
const Select = ({
  name,
  value,
  onChange,
  onBlur,
  options = [],
  disabled = false,
  required = false,
  error = "",
  label,
  placeholder = "Select an option",
  className = "",
  ariaDescribedBy = "",
  ...rest
}) => {
  const selectClasses = [
    styles.select,
    error && styles["select--error"],
    disabled && styles["select--disabled"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const selectId = `select-${name}`;
  const describedBy =
    [ariaDescribedBy, error ? `${selectId}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={selectClasses}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div id={`${selectId}-error`} className={styles.errorText} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    }),
  ),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

Select.displayName = "Select";

export default Select;
