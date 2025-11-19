/**
 * @module Input
 * @description Unified input component with built-in error states and validation.
 * Standardizes input styling and behavior across the app.
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./Form.module.css";

/**
 * Input component with built-in error handling
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {string} props.error - Error message
 * @param {string} props.label - Input label
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaDescribedBy - Space separated IDs for aria-describedby
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} Input component
 */
const Input = ({
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  required = false,
  error = "",
  label,
  className = "",
  ariaDescribedBy = "",
  ...rest
}) => {
  const inputClasses = [
    styles.input,
    error && styles["input--error"],
    disabled && styles["input--disabled"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inputId = `input-${name}`;
  const describedBy =
    [ariaDescribedBy, error ? `${inputId}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
      />
      {error && (
        <div id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

Input.displayName = "Input";

export default Input;
