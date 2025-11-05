/**
 * @module supabaseErrorHandler
 * @description Centralized error handling for Supabase operations
 */

import { parseSupabaseError, createErrorToast } from './supabaseRetry';

/**
 * Format error for display in UI components
 */
export function formatSupabaseError(error) {
  const parsed = parseSupabaseError(error);
  
  return {
    title: parsed.title,
    message: parsed.message,
    suggestion: parsed.suggestion,
    details: error?.message || 'No additional details available',
    originalError: error
  };
}

/**
 * Log error with context
 */
export function logSupabaseError(error, context = {}) {
  const formatted = formatSupabaseError(error);
  
  console.group('🔴 Supabase Error');
  console.error('Title:', formatted.title);
  console.error('Message:', formatted.message);
  console.error('Suggestion:', formatted.suggestion);
  if (context.operation) {
    console.error('Operation:', context.operation);
  }
  if (context.table) {
    console.error('Table:', context.table);
  }
  if (formatted.details) {
    console.error('Details:', formatted.details);
  }
  if (formatted.originalError) {
    console.error('Original Error:', formatted.originalError);
  }
  console.groupEnd();
  
  return formatted;
}

/**
 * Handle query error with logging and formatting
 */
export function handleQueryError(error, context = {}) {
  const formatted = logSupabaseError(error, context);
  
  // Return formatted error for UI display
  return {
    success: false,
    error: formatted,
    data: null
  };
}

/**
 * Wrap Supabase query with error handling
 */
export async function executeWithErrorHandling(
  queryFn,
  context = {}
) {
  try {
    const result = await queryFn();
    
    // Check for Supabase error in result
    if (result?.error) {
      return handleQueryError(result.error, context);
    }
    
    return {
      success: true,
      data: result.data || result,
      error: null
    };
  } catch (error) {
    return handleQueryError(error, context);
  }
}

/**
 * Show error toast notification
 */
export function showErrorToast(error, showToastFn) {
  if (!showToastFn) {
    console.warn('No toast function provided to showErrorToast');
    return;
  }
  
  const toast = createErrorToast(error);
  showToastFn({
    type: toast.type,
    message: `${toast.message}\n${toast.description}`,
    duration: toast.duration
  });
}

/**
 * Create user-friendly error message for specific operations
 */
export const OPERATION_ERRORS = {
  FETCH_NAMES: {
    title: '📋 Cannot Load Names',
    message: 'Unable to load the cat name list.',
    suggestion: 'Please refresh the page or try again later.'
  },
  SAVE_RATING: {
    title: '💾 Cannot Save Rating',
    message: 'Your rating could not be saved.',
    suggestion: 'Your progress may not be saved. Please check your connection.'
  },
  LOAD_PROFILE: {
    title: '👤 Cannot Load Profile',
    message: 'Unable to load your profile data.',
    suggestion: 'Try logging out and back in, or refresh the page.'
  },
  SAVE_SELECTION: {
    title: '✅ Cannot Save Selection',
    message: 'Your name selection could not be saved.',
    suggestion: 'Try selecting the name again or refresh the page.'
  },
  HIDE_NAME: {
    title: '🙈 Cannot Hide Name',
    message: 'Unable to hide this name.',
    suggestion: 'Please try again or refresh the page.'
  },
  LOAD_TOURNAMENT: {
    title: '🏆 Cannot Load Tournament',
    message: 'Tournament data could not be loaded.',
    suggestion: 'Try starting a new tournament or refresh the page.'
  }
};

/**
 * Get operation-specific error message
 */
export function getOperationError(operationType, originalError = null) {
  const operationError = OPERATION_ERRORS[operationType] || {
    title: '❌ Operation Failed',
    message: 'The requested operation could not be completed.',
    suggestion: 'Please try again or contact support if the issue persists.'
  };
  
  return {
    ...operationError,
    originalError
  };
}
