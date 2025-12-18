/**
 * @module errorManager/errorParser
 * @description Error parsing and type determination logic.
 */

import { ERROR_TYPES } from "./constants";

/**
 * * Determines the type of error based on error properties
 * @param {Error|Object} error - The error to analyze
 * @returns {string} Error type
 */
function determineErrorType(error: unknown): string {
  const err = error as Record<string, unknown>;

  // * Check for network connectivity first
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return ERROR_TYPES.NETWORK;
  }

  if (err.code === "PGRST301" || err.code === "PGRST302") {
    return ERROR_TYPES.AUTH;
  }

  if (err.code === "PGRST116" || err.code === "PGRST117") {
    return ERROR_TYPES.VALIDATION;
  }

  // * Enhanced network error detection
  if (
    err.code === "NETWORK_ERROR" ||
    err.name === "NetworkError" ||
    (err.name === "TypeError" &&
      (err.message as string | undefined)?.includes("fetch")) ||
    (err.message as string | undefined)?.includes("fetch") ||
    (err.message as string | undefined)?.includes("network") ||
    (err.message as string | undefined)?.includes("Failed to fetch") ||
    (err.message as string | undefined)?.includes("Network request failed")
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // * Check for timeout errors
  if (
    err.name === "TimeoutError" ||
    (err.name === "AbortError" &&
      (err.message as string | undefined)?.includes("timeout")) ||
    (err.message as string | undefined)?.includes("timeout") ||
    (err.message as string | undefined)?.includes("timed out")
  ) {
    return ERROR_TYPES.NETWORK;
  }

  if (err.status === 0 || err.status === 500) {
    return ERROR_TYPES.NETWORK;
  }

  if (
    (err.message as string | undefined)?.includes("database") ||
    (err.message as string | undefined)?.includes("supabase")
  ) {
    return ERROR_TYPES.DATABASE;
  }

  if (err.name === "TypeError" || err.name === "ReferenceError") {
    return ERROR_TYPES.RUNTIME;
  }

  if (
    err.code === "VALIDATION_ERROR" ||
    (err.message as string | undefined)?.includes("validation")
  ) {
    return ERROR_TYPES.VALIDATION;
  }

  return ERROR_TYPES.UNKNOWN;
}

export interface ParsedError {
  message: string;
  name: string;
  stack: string | null;
  type: string;
  cause?: unknown;
  code?: string | null;
  status?: number | null;
}

/**
 * * Parses different types of error objects
 * @param {Error|Object} error - The error to parse
 * @returns {ParsedError} Parsed error information
 */
export function parseError(error: unknown): ParsedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack || null,
      type: determineErrorType(error),
      cause: error.cause || null,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      name: "StringError",
      stack: null,
      type: ERROR_TYPES.UNKNOWN,
    };
  }

  if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    return {
      message:
        (errObj.message as string) ||
        (errObj.error as string) ||
        "Unknown error occurred",
      name: (errObj.name as string) || "ObjectError",
      stack: (errObj.stack as string) || null,
      type: determineErrorType(error),
      code: (errObj.code as string) || null,
      status: (errObj.status as number) || null,
      cause: errObj.cause || null,
    };
  }

  return {
    message: "An unexpected error occurred",
    name: "UnknownError",
    stack: null,
    type: ERROR_TYPES.UNKNOWN,
  };
}
