/**
 * @module errorManager/constants
 * @description Error management constants for consistent error handling.
 */

import { deepFreeze } from "./helpers";

// * Error types for categorization
export const ERROR_TYPES = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTH: "auth",
  DATABASE: "database",
  RUNTIME: "runtime",
  UNKNOWN: "unknown",
};

deepFreeze(ERROR_TYPES);

// * Error severity levels
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

deepFreeze(ERROR_SEVERITY);

// * User-friendly error messages
export const USER_FRIENDLY_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    [ERROR_SEVERITY.LOW]: "Connection is slow. Please try again.",
    [ERROR_SEVERITY.MEDIUM]:
      "Network issue. Check your connection and try again.",
    [ERROR_SEVERITY.HIGH]: "Can't connect to the server. Try again soon.",
    [ERROR_SEVERITY.CRITICAL]: "Service unavailable. Please try again later.",
  },
  [ERROR_TYPES.AUTH]: {
    [ERROR_SEVERITY.LOW]: "Please log in again.",
    [ERROR_SEVERITY.MEDIUM]: "Session expired. Please log in again.",
    [ERROR_SEVERITY.HIGH]: "Sign-in failed. Check your credentials.",
    [ERROR_SEVERITY.CRITICAL]: "Account access issue. Please contact support.",
  },
  [ERROR_TYPES.DATABASE]: {
    [ERROR_SEVERITY.LOW]: "Data is loading slowly. Please try again.",
    [ERROR_SEVERITY.MEDIUM]: "Can't load data. Please refresh.",
    [ERROR_SEVERITY.HIGH]: "Data access error. Try again later.",
    [ERROR_SEVERITY.CRITICAL]:
      "Database connection issue. Please try again later.",
  },
  [ERROR_TYPES.VALIDATION]: {
    [ERROR_SEVERITY.LOW]: "Please check your input and try again.",
    [ERROR_SEVERITY.MEDIUM]: "Invalid input. Please review and try again.",
    [ERROR_SEVERITY.HIGH]: "Validation failed. Please check your data.",
    [ERROR_SEVERITY.CRITICAL]:
      "Critical validation error. Please contact support.",
  },
  [ERROR_TYPES.RUNTIME]: {
    [ERROR_SEVERITY.LOW]: "Something went wrong. Please try again.",
    [ERROR_SEVERITY.MEDIUM]: "An error occurred. Please refresh.",
    [ERROR_SEVERITY.HIGH]: "App error. Please try again later.",
    [ERROR_SEVERITY.CRITICAL]:
      "Critical application error. Please contact support.",
  },
  [ERROR_TYPES.UNKNOWN]: {
    [ERROR_SEVERITY.LOW]: "Something unexpected happened. Please try again.",
    [ERROR_SEVERITY.MEDIUM]: "Unexpected error. Please try again.",
    [ERROR_SEVERITY.HIGH]: "Unexpected error. Try again later.",
    [ERROR_SEVERITY.CRITICAL]:
      "Critical unexpected error. Please contact support.",
  },
};

deepFreeze(USER_FRIENDLY_MESSAGES);

// * Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: 0.1,
};

deepFreeze(RETRY_CONFIG);
