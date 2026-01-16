import { VALIDATION } from "../../core/constants";

export interface ValidationResult {
  success: boolean;
  error?: string;
  value?: string;
}

export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { success: false, error: "Username is required" };
  }

  const trimmed = username.trim();
  if (trimmed.length < (VALIDATION.MIN_USERNAME_LENGTH || 2)) {
    return { success: false, error: "Username too short" };
  }

  if (trimmed.length > (VALIDATION.MAX_USERNAME_LENGTH || 20)) {
    return { success: false, error: "Username too long" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      success: false,
      error: "Username can only contain alphanumeric characters, - and _",
    };
  }

  return { success: true, value: trimmed };
}

export function validateCatName(name: string): ValidationResult {
  if (!name) {
    return { success: false, error: "Name is required" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { success: false, error: "Name is too short" };
  }

  if (trimmed.length > (VALIDATION.MAX_CAT_NAME_LENGTH || 50)) {
    return { success: false, error: "Name is too long" };
  }

  return { success: true, value: trimmed };
}

export function validateDescription(description: string): ValidationResult {
  const trimmed = (description || "").trim();

  if (trimmed.length > (VALIDATION.MAX_DESCRIPTION_LENGTH || 200)) {
    return {
      success: false,
      error: `Description must be under ${VALIDATION.MAX_DESCRIPTION_LENGTH || 200} characters`,
    };
  }

  return { success: true, value: trimmed };
}
