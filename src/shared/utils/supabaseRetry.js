/**
 * @module supabaseRetry
 * @description Retry logic and error handling utilities for Supabase connections
 */

/**
 * User-friendly error messages for common Supabase errors
 */
const ERROR_MESSAGES = {
  CONNECTION_FAILED: {
    title: '🔌 Connection Failed',
    message: 'Unable to connect to the database. Please check your internet connection.',
    suggestion: 'Try refreshing the page or check your network settings.'
  },
  TIMEOUT: {
    title: '⏱️ Request Timeout',
    message: 'The request took too long to complete.',
    suggestion: 'Please try again in a moment. If this persists, the server may be experiencing high load.'
  },
  NOT_FOUND: {
    title: '🔍 Data Not Found',
    message: 'The requested data could not be found.',
    suggestion: 'The data may have been moved or deleted. Try refreshing the page.'
  },
  PERMISSION_DENIED: {
    title: '🔒 Access Denied',
    message: 'You don\'t have permission to access this data.',
    suggestion: 'Make sure you\'re logged in with the correct account.'
  },
  INVALID_REQUEST: {
    title: '⚠️ Invalid Request',
    message: 'The request couldn\'t be processed due to invalid data.',
    suggestion: 'Please check your input and try again.'
  },
  SERVER_ERROR: {
    title: '🔧 Server Error',
    message: 'The server encountered an unexpected error.',
    suggestion: 'This is a temporary issue. Please try again in a few moments.'
  },
  RATE_LIMIT: {
    title: '🚦 Too Many Requests',
    message: 'You\'ve made too many requests in a short time.',
    suggestion: 'Please wait a moment before trying again.'
  },
  NETWORK_ERROR: {
    title: '🌐 Network Error',
    message: 'Unable to reach the server.',
    suggestion: 'Check your internet connection and firewall settings.'
  },
  CONFIG_ERROR: {
    title: '⚙️ Configuration Error',
    message: 'Database connection is not configured.',
    suggestion: 'Please contact support if you continue to see this message.'
  },
  UNKNOWN: {
    title: '❌ Unexpected Error',
    message: 'Something went wrong.',
    suggestion: 'Please try again. If the problem persists, contact support.'
  }
};

/**
 * Parse Supabase error and return user-friendly message
 */
export function parseSupabaseError(error) {
  if (!error) return ERROR_MESSAGES.UNKNOWN;

  const errorCode = error.code || error.status || '';
  const errorMessage = error.message || '';

  // Connection and network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (errorMessage.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }
  if (errorMessage.includes('not configured') || errorMessage.includes('Missing')) {
    return ERROR_MESSAGES.CONFIG_ERROR;
  }

  // HTTP status codes
  if (errorCode === '404' || errorCode === 404) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  if (errorCode === '401' || errorCode === 401 || errorCode === '403' || errorCode === 403) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  }
  if (errorCode === '400' || errorCode === 400 || errorCode === '422' || errorCode === 422) {
    return ERROR_MESSAGES.INVALID_REQUEST;
  }
  if (errorCode === '429' || errorCode === 429) {
    return ERROR_MESSAGES.RATE_LIMIT;
  }
  if (errorCode >= 500 && errorCode < 600) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // PostgreSQL specific errors
  if (errorCode === '08000' || errorCode === '08003' || errorCode === '08006') {
    return ERROR_MESSAGES.CONNECTION_FAILED;
  }

  return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'fetch',
    'network',
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
    '500',
    '502',
    '503',
    '504',
    '08000', // PostgreSQL connection errors
    '08003',
    '08006'
  ]
};

/**
 * Check if error is retryable
 */
function isRetryableError(error, config = DEFAULT_RETRY_CONFIG) {
  if (!error) return false;

  const errorStr = String(error.message || error.code || error.status || error).toLowerCase();

  return config.retryableErrors.some(retryableError =>
    errorStr.includes(String(retryableError).toLowerCase())
  );
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt, config = DEFAULT_RETRY_CONFIG) {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async operations
 */
export async function retryOperation(
  operation,
  config = {},
  operationName = 'Operation'
) {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName}: Attempt ${attempt + 1}/${retryConfig.maxRetries + 1}`);
      const result = await operation();

      if (attempt > 0) {
        console.log(`✅ ${operationName}: Succeeded after ${attempt + 1} attempts`);
      }

      return { success: true, data: result, error: null };
    } catch (error) {
      lastError = error;

      console.warn(`⚠️ ${operationName}: Attempt ${attempt + 1} failed`, error);

      // If this is the last attempt or error is not retryable, throw
      if (attempt === retryConfig.maxRetries || !isRetryableError(error, retryConfig)) {
        console.error(`❌ ${operationName}: Failed after ${attempt + 1} attempts`, error);
        const userError = parseSupabaseError(error);
        return {
          success: false,
          data: null,
          error: {
            ...userError,
            originalError: error,
            attempts: attempt + 1
          }
        };
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, retryConfig);
      console.log(`⏳ ${operationName}: Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  // This shouldn't be reached, but just in case
  const userError = parseSupabaseError(lastError);
  return {
    success: false,
    data: null,
    error: {
      ...userError,
      originalError: lastError,
      attempts: retryConfig.maxRetries + 1
    }
  };
}

/**
 * Wrapper for Supabase queries with automatic retry
 */
export async function withRetry(queryBuilder, operationName = 'Database query') {
  return retryOperation(
    () => queryBuilder,
    {},
    operationName
  );
}

/**
 * Create a toast-friendly error message
 */
export function createErrorToast(error) {
  const userError = error.error || parseSupabaseError(error);

  return {
    type: 'error',
    message: userError.title,
    description: `${userError.message} ${userError.suggestion}`,
    duration: 6000
  };
}

/**
 * Connection health check with retry
 */
export async function checkConnection(supabaseClient, tableName = 'cat_name_options') {
  return retryOperation(
    async () => {
      if (!supabaseClient) {
        throw new Error('Supabase client not configured');
      }

      const { error } = await supabaseClient
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) throw error;

      return true;
    },
    { maxRetries: 2, initialDelay: 500 },
    'Connection health check'
  );
}
