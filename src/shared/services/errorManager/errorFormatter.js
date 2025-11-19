/**
 * @module errorManager/errorFormatter
 * @description Error formatting and severity determination logic.
 */

import { ERROR_TYPES, ERROR_SEVERITY, USER_FRIENDLY_MESSAGES } from './constants';
import { determineErrorType } from './errorParser';
import { generateErrorId } from './errorId';
import { buildDiagnostics } from './diagnostics';
import { buildAIContext } from './aiContext';

/**
 * * Determines error severity based on type and metadata
 * @param {Object} errorInfo - Parsed error information
 * @param {Object} metadata - Error metadata
 * @returns {string} Severity level
 */
export function determineSeverity(errorInfo, metadata) {
  if (metadata.isCritical) {
    return ERROR_SEVERITY.CRITICAL;
  }

  if (metadata.affectsUserData) {
    return ERROR_SEVERITY.HIGH;
  }

  switch (errorInfo.type) {
    case ERROR_TYPES.AUTH:
      return ERROR_SEVERITY.HIGH;
    case ERROR_TYPES.DATABASE:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_TYPES.NETWORK:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_TYPES.VALIDATION:
      return ERROR_SEVERITY.LOW;
    case ERROR_TYPES.RUNTIME:
      return ERROR_SEVERITY.MEDIUM;
    default:
      return ERROR_SEVERITY.MEDIUM;
  }
}

/**
 * * Generates user-friendly error messages
 * @param {Object} errorInfo - Parsed error information
 * @param {string} context - Error context
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(errorInfo, context) {
  const contextMap = {
    'Tournament Completion': 'Failed to complete tournament',
    'Tournament Setup': 'Failed to set up tournament',
    'Rating Update': 'Failed to update ratings',
    'Save Rankings': 'Failed to save ranking changes',
    Login: 'Failed to log in',
    'User Login': 'Unable to log in',
    'Profile Load': 'Failed to load profile',
    'Database Query': 'Failed to fetch data',
    'Load Cat Name': 'Failed to load cat name',
    'Fetch Cat Fact': 'Unable to load cat fact',
    'Audio Playback': 'Unable to play audio',
    'React Component Error': 'A component error occurred'
  };

  const contextMessage = contextMap[context] || 'An error occurred';
  const severity = determineSeverity(errorInfo, {});

  // * Check for network connectivity
  if (errorInfo.type === ERROR_TYPES.NETWORK) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline) {
      return 'You appear to be offline. Please check your internet connection and try again.';
    }
    return USER_FRIENDLY_MESSAGES[errorInfo.type]?.[severity] ||
           `${contextMessage}. Please check your connection and try again.`;
  }

  return USER_FRIENDLY_MESSAGES[errorInfo.type]?.[severity] ||
         `${contextMessage}. Please try again.`;
}

/**
 * * Determines if an error is retryable
 * @param {Object} errorInfo - Parsed error information
 * @param {Object} metadata - Error metadata
 * @returns {boolean} Whether error is retryable
 */
export function isRetryable(errorInfo, metadata) {
  if (metadata.isRetryable === false) {
    return false;
  }

  if (metadata.isRetryable === true) {
    return true;
  }

  // * Network errors are generally retryable
  if (errorInfo.type === ERROR_TYPES.NETWORK) {
    return true;
  }

  // * Database errors might be retryable
  if (errorInfo.type === ERROR_TYPES.DATABASE) {
    return true;
  }

  // * Auth errors are not retryable
  if (errorInfo.type === ERROR_TYPES.AUTH) {
    return false;
  }

  // * Validation errors are not retryable
  if (errorInfo.type === ERROR_TYPES.VALIDATION) {
    return false;
  }

  return false;
}

/**
 * * Formats error for consistent UI display
 * @param {Object} errorInfo - Parsed error information
 * @param {string} context - Context where error occurred
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted error for UI
 */
export function formatError(errorInfo, context, metadata) {
  const severity = determineSeverity(errorInfo, metadata);
  const userMessage = getUserFriendlyMessage(errorInfo, context);
  const retryable = isRetryable(errorInfo, metadata);
  const diagnostics = buildDiagnostics(errorInfo, context, metadata);

  const formatted = {
    id: generateErrorId(),
    message: errorInfo.message,
    userMessage,
    context,
    type: errorInfo.type,
    severity,
    isRetryable: retryable,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      originalError: errorInfo,
      stack: errorInfo.stack
    },
    diagnostics,
    aiContext: ''
  };

  formatted.aiContext = buildAIContext({
    formattedError: formatted,
    diagnostics
  });

  return formatted;
}

