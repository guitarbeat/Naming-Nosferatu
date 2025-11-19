/**
 * @module components/formUtils
 * @description Form-related utility hooks for managing form state and validation
 */

import { useCallback, useState } from "react";

/**
 * * Creates a standardized form state manager
 * @param {Object} initialValues - Initial form values
 * @param {Object} validators - Validation functions for each field
 * @returns {Object} Form state and handlers
 */
export function useFormState(initialValues = {}, validators = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (field, value) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const setFieldError = useCallback((field, error) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback(
    (field, value) => {
      const validator = validators[field];
      if (!validator) return { success: true };

      const result = validator(value);
      if (!result.success) {
        setFieldError(field, result.error);
      } else {
        setFieldError(field, "");
      }
      return result;
    },
    [validators, setFieldError],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    for (const [field, value] of Object.entries(values)) {
      const validator = validators[field];
      if (validator) {
        const result = validator(value);
        if (!result.success) {
          newErrors[field] = result.error;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validators]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (onSubmit) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const isValid = validateForm();
        if (isValid) {
          await onSubmit(values);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, validateForm, values],
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
  };
}
