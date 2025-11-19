/**
 * @module errorManager/errorParser
 * @description Error parsing and type determination logic.
 */

import { ERROR_TYPES } from './constants';

/**
 * * Determines the type of error based on error properties
 * @param {Error|Object} error - The error to analyze
 * @returns {string} Error type
 */
export function determineErrorType(error) {
  // * Check for network connectivity first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return ERROR_TYPES.NETWORK;
  }

  if (error.code === 'PGRST301' || error.code === 'PGRST302') {
    return ERROR_TYPES.AUTH;
  }

  if (error.code === 'PGRST116' || error.code === 'PGRST117') {
    return ERROR_TYPES.VALIDATION;
  }

  // * Enhanced network error detection
  if (
    error.code === 'NETWORK_ERROR' || 
    error.name === 'NetworkError' ||
    (error.name === 'TypeError' && error.message?.includes('fetch')) ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Network request failed')
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // * Check for timeout errors
  if (
    error.name === 'TimeoutError' ||
    (error.name === 'AbortError' && error.message?.includes('timeout')) ||
    error.message?.includes('timeout') ||
    error.message?.includes('timed out')
  ) {
    return ERROR_TYPES.NETWORK;
  }

  if (error.status === 0 || error.status === 500) {
    return ERROR_TYPES.NETWORK;
  }

  if (error.message?.includes('database') || error.message?.includes('supabase')) {
    return ERROR_TYPES.DATABASE;
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return ERROR_TYPES.RUNTIME;
  }

  if (error.code === 'VALIDATION_ERROR' || error.message?.includes('validation')) {
    return ERROR_TYPES.VALIDATION;
  }

  return ERROR_TYPES.UNKNOWN;
}

/**
 * * Parses different types of error objects
 * @param {Error|Object} error - The error to parse
 * @returns {Object} Parsed error information
 */
export function parseError(error) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      type: determineErrorType(error),
      cause: error.cause || null
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      name: 'StringError',
      stack: null,
      type: ERROR_TYPES.UNKNOWN
    };
  }

  if (error && typeof error === 'object') {
    return {
      message: error.message || error.error || 'Unknown error occurred',
      name: error.name || 'ObjectError',
      stack: error.stack || null,
      type: determineErrorType(error),
      code: error.code || null,
      status: error.status || null,
      cause: error.cause || null
    };
  }

  return {
    message: 'An unexpected error occurred',
    name: 'UnknownError',
    stack: null,
    type: ERROR_TYPES.UNKNOWN
  };
}

