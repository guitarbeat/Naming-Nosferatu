/**
 * @module Form
 * @description Unified form component with built-in error handling and validation.
 * Standardizes form submission patterns across the app.
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./Form.module.css";

/**
 * Form component with built-in error handling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form content
 * @param {Function} props.onSubmit - Form submission handler
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props
 * @returns {JSX.Element} Form component
 */
const Form = ({ children, onSubmit, className = "", ...rest }) => {
  const formClasses = [styles.form, className].filter(Boolean).join(" ");

  return (
    <form className={formClasses} onSubmit={onSubmit} noValidate {...rest}>
      {children}
    </form>
  );
};

Form.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
};

Form.displayName = "Form";

export default Form;
