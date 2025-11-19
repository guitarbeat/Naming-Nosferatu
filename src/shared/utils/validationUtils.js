/**
 * @module validationUtils
 * @description Consolidated validation utilities for the cat names application.
 * Provides consistent validation across all user inputs using centralized constants.
 */

import { VALIDATION } from "../../core/constants";

/**
 * * Validates a username
 * @param {string} username - The username to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== "string") {
    return { success: false, error: "Username is required" };
  }

  const trimmed = username.trim();

  if (trimmed.length < VALIDATION.MIN_USERNAME_LENGTH) {
    return {
      success: false,
      error: `Username must be at least ${VALIDATION.MIN_USERNAME_LENGTH} characters long`,
    };
  }

  if (trimmed.length > VALIDATION.MAX_USERNAME_LENGTH) {
    return {
      success: false,
      error: `Username must be less than ${VALIDATION.MAX_USERNAME_LENGTH} characters`,
    };
  }

  // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
  if (!VALIDATION.USERNAME_PATTERN_EXTENDED.test(trimmed)) {
    return {
      success: false,
      error:
        "Username can only contain letters, numbers, spaces, hyphens, and underscores",
    };
  }

  return { success: true, value: trimmed };
};

/**
 * * Validates a cat name
 * @param {string} name - The cat name to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateCatName = (name) => {
  if (!name || typeof name !== "string") {
    return { success: false, error: "Cat name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < VALIDATION.MIN_CAT_NAME_LENGTH) {
    return {
      success: false,
      error: `Cat name must be at least ${VALIDATION.MIN_CAT_NAME_LENGTH} character long`,
    };
  }

  if (trimmed.length > VALIDATION.MAX_CAT_NAME_LENGTH) {
    return {
      success: false,
      error: `Cat name must be less than ${VALIDATION.MAX_CAT_NAME_LENGTH} characters`,
    };
  }

  return { success: true, value: trimmed };
};

/**
 * * Validates a description
 * @param {string} description - The description to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateDescription = (description) => {
  if (!description || typeof description !== "string") {
    return { success: false, error: "Description is required" };
  }

  const trimmed = description.trim();

  if (trimmed.length < VALIDATION.MIN_DESCRIPTION_LENGTH_EXTENDED) {
    return {
      success: false,
      error: `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH_EXTENDED} characters long`,
    };
  }

  if (trimmed.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    return {
      success: false,
      error: `Description must be less than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
    };
  }

  return { success: true, value: trimmed };
};

/**
 * * Validates tournament size preference
 * @param {number} size - The tournament size to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateTournamentSize = (size) => {
  if (typeof size !== "number" || isNaN(size)) {
    return { success: false, error: "Tournament size must be a number" };
  }

  if (size < VALIDATION.MIN_TOURNAMENT_SIZE) {
    return {
      success: false,
      error: `Tournament size must be at least ${VALIDATION.MIN_TOURNAMENT_SIZE}`,
    };
  }

  if (size > VALIDATION.MAX_TOURNAMENT_SIZE) {
    return {
      success: false,
      error: `Tournament size must be ${VALIDATION.MAX_TOURNAMENT_SIZE} or less`,
    };
  }

  // Check if it's a power of 2
  if ((size & (size - 1)) !== 0) {
    return {
      success: false,
      error: "Tournament size must be a power of 2 (2, 4, 8, 16, 32, 64)",
    };
  }

  return { success: true, value: size };
};

/**
 * * Validates a rating value
 * @param {number} rating - The rating to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateRating = (rating) => {
  if (typeof rating !== "number" || isNaN(rating)) {
    return { success: false, error: "Rating must be a number" };
  }

  if (rating < VALIDATION.MIN_RATING) {
    return { success: false, error: "Rating cannot be negative" };
  }

  if (rating > VALIDATION.MAX_RATING) {
    return {
      success: false,
      error: `Rating cannot exceed ${VALIDATION.MAX_RATING}`,
    };
  }

  return { success: true, value: rating };
};

/**
 * * Validates email format (if needed for future features)
 * @param {string} email - The email to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  if (!VALIDATION.EMAIL_PATTERN.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  return { success: true, value: trimmed };
};

/**
 * * Generic validation wrapper for form fields
 * @param {Object} validations - Object with field names and validation functions
 * @param {Object} values - Object with field values to validate
 * @returns {Object} Validation result with success and errors
 */
export const validateForm = (validations, values) => {
  const errors = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validations)) {
    const result = validator(values[field]);
    if (!result.success) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return {
    success: isValid,
    errors,
    values: isValid ? values : null,
  };
};

/**
 * * Validates a name using the general name validation rules
 * @param {string} name - The name to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateName = (name) => {
  if (!name || typeof name !== "string") {
    return { success: false, error: "Name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < VALIDATION.MIN_NAME_LENGTH) {
    return {
      success: false,
      error: `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} character long`,
    };
  }

  if (trimmed.length > VALIDATION.MAX_NAME_LENGTH) {
    return {
      success: false,
      error: `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`,
    };
  }

  return { success: true, value: trimmed };
};

/**
 * * Validates a description using the general description validation rules
 * @param {string} description - The description to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateGeneralDescription = (description) => {
  if (!description || typeof description !== "string") {
    return { success: false, error: "Description is required" };
  }

  const trimmed = description.trim();

  if (trimmed.length < VALIDATION.MIN_DESCRIPTION_LENGTH) {
    return {
      success: false,
      error: `Description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters long`,
    };
  }

  if (trimmed.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    return {
      success: false,
      error: `Description must be less than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`,
    };
  }

  return { success: true, value: trimmed };
};

export default {
  validateUsername,
  validateCatName,
  validateDescription,
  validateTournamentSize,
  validateRating,
  validateEmail,
  validateForm,
  validateName,
  validateGeneralDescription,
};
