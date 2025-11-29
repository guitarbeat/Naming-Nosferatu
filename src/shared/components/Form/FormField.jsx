/**
 * @module FormField
 * @description Shared wrapper component for form fields that provides consistent
 * label, error handling, and accessibility patterns. Used by Input and Select components.
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
  const fieldId = id || `${name ? `${name}-field` : `field-${Math.random().toString(36).substr(2, 9)}`}`;
  const errorId = error ? `${fieldId}-error` : null;
  const describedBy = [ariaDescribedBy, errorId]
    .filter(Boolean)
    .join(" ") || undefined;

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

export default FormField;

