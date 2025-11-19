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
      "Network connection issue. Please check your internet and try again.",
    [ERROR_SEVERITY.HIGH]:
      "Unable to connect to the server. Please try again later.",
    [ERROR_SEVERITY.CRITICAL]:
      "Service temporarily unavailable. Please try again later.",
  },
  [ERROR_TYPES.AUTH]: {
    [ERROR_SEVERITY.LOW]: "Please log in again.",
    [ERROR_SEVERITY.MEDIUM]: "Your session has expired. Please log in again.",
    [ERROR_SEVERITY.HIGH]:
      "Authentication failed. Please check your credentials.",
    [ERROR_SEVERITY.CRITICAL]: "Account access issue. Please contact support.",
  },
  [ERROR_TYPES.DATABASE]: {
    [ERROR_SEVERITY.LOW]: "Data loading is slow. Please try again.",
    [ERROR_SEVERITY.MEDIUM]: "Unable to load data. Please refresh the page.",
    [ERROR_SEVERITY.HIGH]: "Data access error. Please try again later.",
    [ERROR_SEVERITY.CRITICAL]:
      "Database connection issue. Please try again later.",
  },
  [ERROR_TYPES.VALIDATION]: {
    [ERROR_SEVERITY.LOW]: "Please check your input and try again.",
    [ERROR_SEVERITY.MEDIUM]:
      "Invalid input detected. Please review and try again.",
    [ERROR_SEVERITY.HIGH]: "Input validation failed. Please check your data.",
    [ERROR_SEVERITY.CRITICAL]:
      "Critical validation error. Please contact support.",
  },
  [ERROR_TYPES.RUNTIME]: {
    [ERROR_SEVERITY.LOW]: "Something went wrong. Please try again.",
    [ERROR_SEVERITY.MEDIUM]: "An error occurred. Please refresh the page.",
    [ERROR_SEVERITY.HIGH]: "Application error. Please try again later.",
    [ERROR_SEVERITY.CRITICAL]:
      "Critical application error. Please contact support.",
  },
  [ERROR_TYPES.UNKNOWN]: {
    [ERROR_SEVERITY.LOW]: "Something unexpected happened. Please try again.",
    [ERROR_SEVERITY.MEDIUM]: "An unexpected error occurred. Please try again.",
    [ERROR_SEVERITY.HIGH]: "Unexpected error. Please try again later.",
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
