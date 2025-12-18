/**
 * @module Form
 * @description Unified form components with built-in error states and validation.
 * Combines Input, Select, and FormField functionality.
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./Form.module.css";

/**
 * FormField wrapper component that provides consistent structure for form inputs
 * @param {Object} props - Component props
 * @param {string} props.id - Field ID (auto-generated if not provided)
 * @param {string} props.name - Field name (required for ID generation)
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.ariaDescribedBy - Additional aria-describedby IDs
 * @param {React.ReactNode} props.children - The input/select element
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} FormField wrapper
 */
const FormField = ({
  id,
  name,
  label,
  error = "",
  required = false,
  ariaDescribedBy = "",
  children,
  className = "",
}) => {
  const generatedId = React.useId();
  const fieldId = id || `${name ? `${name}-field` : `field-${generatedId}`}`;
  const errorId = error ? `${fieldId}-error` : null;
  const describedBy =
    [ariaDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`${styles.inputGroup} ${className}`.trim()}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {React.cloneElement(children, {
        id: fieldId,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
      })}
      {error && (
        <div id={errorId} className={styles.errorText} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

FormField.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  ariaDescribedBy: PropTypes.string,
  children: PropTypes.element.isRequired,
  className: PropTypes.string,
};

FormField.displayName = "FormField";

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

  return (
    <FormField
      name={name}
      label={label}
      error={error}
      required={required}
      ariaDescribedBy={ariaDescribedBy}
    >
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...rest}
      />
    </FormField>
  );
};

Input.propTypes = {
  type: PropTypes.oneOf([
    "text",
    "email",
    "password",
    "number",
    "tel",
    "url",
    "search",
  ]),
  name: PropTypes.string,
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

  return (
    <FormField
      name={name}
      label={label}
      error={error}
      required={required}
      ariaDescribedBy={ariaDescribedBy}
    >
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={selectClasses}
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
    </FormField>
  );
};

Select.propTypes = {
  name: PropTypes.string,
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

export { Input, Select, FormField };
