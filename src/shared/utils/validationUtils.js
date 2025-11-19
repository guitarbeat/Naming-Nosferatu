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

// * Unused validation functions removed
// const validateTournamentSize = (size) => { ... }
// const validateRating = (rating) => { ... }
// const validateEmail = (email) => { ... }
// const validateForm = (validations, values) => { ... }
// const validateName = (name) => { ... }
// const validateGeneralDescription = (description) => { ... }
