/**
 * @module ErrorManager
 * @description Comprehensive error handling service for the application.
 * Consolidates error handling, logging, retry logic, and circuit breaker patterns.
 */

const GLOBAL_SCOPE = typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
    ? window
    : {};

const deepFreeze = (object) => {
  if (object && typeof object === 'object' && !Object.isFrozen(object)) {
    Object.values(object).forEach((value) => {
      if (typeof value === 'object' && value !== null) {
        deepFreeze(value);
      }
    });
    Object.freeze(object);
  }
  return object;
};

const createHash = (value) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  let hash = 0;
  if (!stringValue) {
    return 'hash_0';
  }

  for (let index = 0; index < stringValue.length; index += 1) {
    hash = (hash << 5) - hash + stringValue.charCodeAt(index);
    hash |= 0; // Convert to 32bit integer
  }

  return `hash_${Math.abs(hash)}`;
};

// * Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'auth',
  DATABASE: 'database',
  RUNTIME: 'runtime',
  UNKNOWN: 'unknown'
};

deepFreeze(ERROR_TYPES);

// * Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

deepFreeze(ERROR_SEVERITY);

// * User-friendly error messages
export const USER_FRIENDLY_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    [ERROR_SEVERITY.LOW]: 'Connection is slow. Please try again.',
    [ERROR_SEVERITY.MEDIUM]: 'Network connection issue. Please check your internet and try again.',
    [ERROR_SEVERITY.HIGH]: 'Unable to connect to the server. Please try again later.',
    [ERROR_SEVERITY.CRITICAL]: 'Service temporarily unavailable. Please try again later.'
  },
  [ERROR_TYPES.AUTH]: {
    [ERROR_SEVERITY.LOW]: 'Please log in again.',
    [ERROR_SEVERITY.MEDIUM]: 'Your session has expired. Please log in again.',
    [ERROR_SEVERITY.HIGH]: 'Authentication failed. Please check your credentials.',
    [ERROR_SEVERITY.CRITICAL]: 'Account access issue. Please contact support.'
  },
  [ERROR_TYPES.DATABASE]: {
    [ERROR_SEVERITY.LOW]: 'Data loading is slow. Please try again.',
    [ERROR_SEVERITY.MEDIUM]: 'Unable to load data. Please refresh the page.',
    [ERROR_SEVERITY.HIGH]: 'Data access error. Please try again later.',
    [ERROR_SEVERITY.CRITICAL]: 'Database connection issue. Please try again later.'
  },
  [ERROR_TYPES.VALIDATION]: {
    [ERROR_SEVERITY.LOW]: 'Please check your input and try again.',
    [ERROR_SEVERITY.MEDIUM]: 'Invalid input detected. Please review and try again.',
    [ERROR_SEVERITY.HIGH]: 'Input validation failed. Please check your data.',
    [ERROR_SEVERITY.CRITICAL]: 'Critical validation error. Please contact support.'
  },
  [ERROR_TYPES.RUNTIME]: {
    [ERROR_SEVERITY.LOW]: 'Something went wrong. Please try again.',
    [ERROR_SEVERITY.MEDIUM]: 'An error occurred. Please refresh the page.',
    [ERROR_SEVERITY.HIGH]: 'Application error. Please try again later.',
    [ERROR_SEVERITY.CRITICAL]: 'Critical application error. Please contact support.'
  },
  [ERROR_TYPES.UNKNOWN]: {
    [ERROR_SEVERITY.LOW]: 'Something unexpected happened. Please try again.',
    [ERROR_SEVERITY.MEDIUM]: 'An unexpected error occurred. Please try again.',
    [ERROR_SEVERITY.HIGH]: 'Unexpected error. Please try again later.',
    [ERROR_SEVERITY.CRITICAL]: 'Critical unexpected error. Please contact support.'
  }
};

deepFreeze(USER_FRIENDLY_MESSAGES);

// * Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: 0.1
};

deepFreeze(RETRY_CONFIG);

/**
 * * Comprehensive error management class
 */
export class ErrorManager {
  /**
   * * Handles errors with consistent formatting and logging
   * @param {Error|Object} error - The error object or error-like object
   * @param {string} context - Context where the error occurred
   * @param {Object} metadata - Additional metadata about the error
   * @returns {Object} Formatted error object for UI display
   */
  static handleError(error, context = 'Unknown', metadata = {}) {
    const errorInfo = this.parseError(error);
    const formattedError = this.formatError(errorInfo, context, metadata);

    // * Log error for debugging
    this.logError(formattedError, context, metadata);

    return formattedError;
  }

  /**
   * * Parses different types of error objects
   * @param {Error|Object} error - The error to parse
   * @returns {Object} Parsed error information
   */
  static parseError(error) {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
        type: this.determineErrorType(error),
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
        type: this.determineErrorType(error),
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

  /**
   * * Determines the type of error based on error properties
   * @param {Error|Object} error - The error to analyze
   * @returns {string} Error type
   */
  static determineErrorType(error) {
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      return ERROR_TYPES.AUTH;
    }

    if (error.code === 'PGRST116' || error.code === 'PGRST117') {
      return ERROR_TYPES.VALIDATION;
    }

    if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
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
   * * Formats error for consistent UI display
   * @param {Object} errorInfo - Parsed error information
   * @param {string} context - Context where error occurred
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Formatted error for UI
   */
  static formatError(errorInfo, context, metadata) {
    const severity = this.determineSeverity(errorInfo, metadata);
    const userMessage = this.getUserFriendlyMessage(errorInfo, context);
    const isRetryable = this.isRetryable(errorInfo, metadata);
    const diagnostics = this.buildDiagnostics(errorInfo, context, metadata);

    const formatted = {
      id: this.generateErrorId(),
      message: errorInfo.message,
      userMessage,
      context,
      type: errorInfo.type,
      severity,
      isRetryable,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        originalError: errorInfo,
        stack: errorInfo.stack
      },
      diagnostics,
      aiContext: ''
    };

    formatted.aiContext = this.buildAIContext({
      formattedError: formatted,
      diagnostics
    });

    return formatted;
  }

  /**
   * * Determines error severity based on type and metadata
   * @param {Object} errorInfo - Parsed error information
   * @param {Object} metadata - Error metadata
   * @returns {string} Severity level
   */
  static determineSeverity(errorInfo, metadata) {
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
  static getUserFriendlyMessage(errorInfo, context) {
    const contextMap = {
      'Tournament Completion': 'Failed to complete tournament',
      'Tournament Setup': 'Failed to set up tournament',
      'Rating Update': 'Failed to update ratings',
      Login: 'Failed to log in',
      'Profile Load': 'Failed to load profile',
      'Database Query': 'Failed to fetch data'
    };

    const contextMessage = contextMap[context] || 'An error occurred';
    const severity = this.determineSeverity(errorInfo, {});

    return USER_FRIENDLY_MESSAGES[errorInfo.type]?.[severity] ||
           `${contextMessage}. Please try again.`;
  }

  /**
   * * Determines if an error is retryable
   * @param {Object} errorInfo - Parsed error information
   * @param {Object} metadata - Error metadata
   * @returns {boolean} Whether error is retryable
   */
  static isRetryable(errorInfo, metadata) {
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
   * * Generates unique error ID
   * @returns {string} Unique error identifier
   */
  static generateErrorId() {
    if (GLOBAL_SCOPE.crypto?.randomUUID) {
      return `error_${GLOBAL_SCOPE.crypto.randomUUID()}`;
    }

    const randomSegment = Math.random().toString(36).slice(2, 11);
    return `error_${Date.now()}_${randomSegment}`;
  }

  /**
   * * Logs error information for debugging
   * @param {Object} formattedError - Formatted error object
   * @param {string} context - Error context
   * @param {Object} metadata - Error metadata
   */
  static logError(formattedError, context, metadata) {
    const logData = {
      error: formattedError,
      context,
      metadata,
      timestamp: new Date().toISOString()
    };

    // * Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error in ${context}`);
      console.error('Error Details:', logData);
      console.groupEnd();
    }

    // * Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(logData);
    }
  }

  static buildDiagnostics(errorInfo, context, metadata) {
    const environment = this.collectEnvironmentSnapshot();
    const stackFrames = this.extractStackFrames(errorInfo.stack);
    const debugHints = this.deriveDebugHints(errorInfo, context, metadata, environment);
    const fingerprint = this.generateFingerprint(errorInfo, context, metadata, environment);

    return {
      fingerprint,
      stackFrames,
      environment,
      debugHints,
      relatedIdentifiers: this.collectRelatedIdentifiers(metadata)
    };
  }

  static extractStackFrames(stack) {
    if (!stack || typeof stack !== 'string') {
      return [];
    }

    return stack
      .split('\n')
      .slice(1)
      .map(line => line.trim())
      .map((frame) => {
        const stackRegex = /at (?:(?<functionName>[^\s]+)\s+)?\(?(?<file>[^:]+):(?<line>\d+):(?<column>\d+)\)?/;
        const match = frame.match(stackRegex);
        if (!match || !match.groups) {
          return { raw: frame };
        }

        return {
          functionName: match.groups.functionName || 'anonymous',
          file: match.groups.file,
          line: Number.parseInt(match.groups.line, 10),
          column: Number.parseInt(match.groups.column, 10)
        };
      });
  }

  static collectEnvironmentSnapshot() {
    try {
      const { navigator = {}, location = {}, performance = {} } = GLOBAL_SCOPE;
      const memory = navigator.deviceMemory ?? navigator.hardwareConcurrency;
      const timing = performance?.timing || {};
      const timezone = (() => {
        try {
          if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
            return new Intl.DateTimeFormat().resolvedOptions().timeZone;
          }
        } catch (_) {
          return undefined;
        }
        return undefined;
      })();

      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        platform: navigator.platform,
        deviceMemory: memory,
        timezone,
        viewport: {
          width: GLOBAL_SCOPE.innerWidth,
          height: GLOBAL_SCOPE.innerHeight
        },
        location: location.href,
        performance: {
          navigationStart: timing.navigationStart,
          domComplete: timing.domComplete,
          firstPaint: performance?.getEntriesByName?.('first-paint')?.[0]?.startTime
        }
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to collect environment snapshot:', error);
      }
      return {};
    }
  }

  static deriveDebugHints(errorInfo, context, metadata, environment) {
    const hints = [];

    if (errorInfo.cause) {
      let causeDetail;
      if (typeof errorInfo.cause === 'string') {
        causeDetail = errorInfo.cause;
      } else {
        try {
          causeDetail = JSON.stringify(errorInfo.cause);
        } catch (err) {
          causeDetail = `Cause available but could not be stringified (${err.message})`;
        }
      }

      hints.push({
        title: 'Root cause provided',
        detail: causeDetail
      });
    }

    if (metadata?.request) {
      hints.push({
        title: 'Network request context',
        detail: `Request to ${metadata.request?.url || 'unknown URL'} failed with status ${metadata.request?.status ?? 'unknown'}`
      });
    }

    switch (errorInfo.type) {
      case ERROR_TYPES.NETWORK:
        hints.push({
          title: 'Connectivity check',
          detail: environment.online === false
            ? 'Navigator reports the client is offline.'
            : 'Verify the network request payload and server availability.'
        });
        break;
      case ERROR_TYPES.AUTH:
        hints.push({
          title: 'Authentication hint',
          detail: 'Confirm that the session token is valid and has not expired.'
        });
        break;
      case ERROR_TYPES.DATABASE:
        hints.push({
          title: 'Database hint',
          detail: 'Check Supabase policies or stored procedures relevant to this operation.'
        });
        break;
      case ERROR_TYPES.VALIDATION:
        hints.push({
          title: 'Validation hint',
          detail: 'Compare the provided payload against the schema definition.'
        });
        break;
      case ERROR_TYPES.RUNTIME:
        hints.push({
          title: 'Runtime hint',
          detail: 'Inspect recent code changes for undefined variables or null references.'
        });
        break;
      default:
        break;
    }

    if (errorInfo.stack && metadata?.componentStack) {
      hints.push({
        title: 'React component stack',
        detail: metadata.componentStack
      });
    }

    return hints;
  }

  static generateFingerprint(errorInfo, context, metadata, environment) {
    const source = {
      type: errorInfo.type,
      name: errorInfo.name,
      message: errorInfo.message,
      context,
      metadata,
      location: environment.location
    };

    return createHash(source);
  }

  static collectRelatedIdentifiers(metadata) {
    const identifiers = new Set();

    if (metadata?.userId) {
      identifiers.add(metadata.userId);
    }

    if (metadata?.sessionId) {
      identifiers.add(metadata.sessionId);
    }

    if (metadata?.request?.id) {
      identifiers.add(metadata.request.id);
    }

    return Array.from(identifiers);
  }

  static buildAIContext({ formattedError, diagnostics }) {
    const baseInfo = [
      `Error ID: ${formattedError.id || 'unknown'}`,
      `Type: ${formattedError.type}`,
      `Severity: ${formattedError.severity}`,
      `Context: ${formattedError.context}`,
      `Message: ${formattedError.message}`
    ];

    if (formattedError.code) {
      baseInfo.push(`Code: ${formattedError.code}`);
    }

    if (formattedError.status) {
      baseInfo.push(`Status: ${formattedError.status}`);
    }

    if (diagnostics?.debugHints?.length) {
      baseInfo.push('Hints:');
      diagnostics.debugHints.forEach((hint, index) => {
        baseInfo.push(`  ${index + 1}. ${hint.title} - ${hint.detail}`);
      });
    }

    if (diagnostics?.stackFrames?.length) {
      baseInfo.push('Top stack frame:');
      const [topFrame] = diagnostics.stackFrames;
      if (topFrame?.raw) {
        baseInfo.push(`  ${topFrame.raw}`);
      } else {
        baseInfo.push(`  ${topFrame.functionName} at ${topFrame.file}:${topFrame.line}:${topFrame.column}`);
      }
    }

    baseInfo.push(`Fingerprint: ${diagnostics?.fingerprint}`);

    return baseInfo.join('\n');
  }

  /**
   * * Sends error data to external error tracking service
   * @param {Object} logData - Error log data to send
   * @private
   */
  static sendToErrorService(logData) {
    try {
      const { navigator = {}, location = {} } = GLOBAL_SCOPE;

      const errorData = {
        message: logData.error.message,
        level: logData.error.severity,
        timestamp: logData.timestamp,
        context: logData.context,
        metadata: logData.metadata,
        userAgent: navigator.userAgent,
        url: location.href,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.REACT_APP_VERSION || '1.0.0'
      };

      // Send to multiple error tracking services
      this.sendToSentry(errorData);
      this.sendToCustomEndpoint(errorData);
      this.sendToConsole(errorData);

    } catch (err) {
      // Don't let error tracking itself cause more errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send error to tracking service:', err);
      }
    }
  }

  /**
   * Sends error to Sentry if available
   * @param {Object} errorData - Error data to send
   * @private
   */
  static sendToSentry(errorData) {
    try {
      const sentry = GLOBAL_SCOPE.Sentry;
      if (sentry && typeof sentry.captureException === 'function') {
        const error = new Error(errorData.message);
        error.name = errorData.context || 'ApplicationError';

        sentry.captureException(error, {
          tags: {
            context: errorData.context,
            level: errorData.level,
            userId: errorData.userId
          },
          extra: {
            ...errorData.metadata,
            url: errorData.url,
            userAgent: errorData.userAgent,
            sessionId: errorData.sessionId,
            buildVersion: errorData.buildVersion
          },
          level: this.mapSeverityToSentryLevel(errorData.level)
        });
      }
    } catch (err) {
      console.warn('Failed to send to Sentry:', err);
    }
  }

  /**
   * Sends error to custom endpoint
   * @param {Object} errorData - Error data to send
   * @private
   */
  static sendToCustomEndpoint(errorData) {
    try {
      const errorEndpoint = process.env.REACT_APP_ERROR_ENDPOINT;
      if (errorEndpoint) {
        const fetchFn = GLOBAL_SCOPE.fetch || (typeof fetch === 'function' ? fetch : null);
        fetchFn?.(errorEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Error-Source': 'name-nosferatu'
          },
          body: JSON.stringify(errorData)
        }).catch(err => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to send error to custom endpoint:', err);
          }
        });
      }
    } catch (err) {
      console.warn('Failed to send to custom endpoint:', err);
    }
  }

  /**
   * Sends error to console for development
   * @param {Object} errorData - Error data to send
   * @private
   */
  static sendToConsole(errorData) {
    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed('🚨 Error Tracking Service');
      console.log('Error Data:', errorData);
      console.log('Sentry Available:', !!GLOBAL_SCOPE.Sentry);
      console.log('Custom Endpoint:', process.env.REACT_APP_ERROR_ENDPOINT || 'Not configured');
      console.groupEnd();
    }
  }

  /**
   * Gets the current session ID for error tracking context
   * @returns {string} Session ID
   * @private
   */
  static getSessionId() {
    try {
      const storage = GLOBAL_SCOPE.sessionStorage;
      let sessionId = storage?.getItem('errorSessionId');
      if (!sessionId) {
        sessionId = GLOBAL_SCOPE.crypto?.randomUUID
          ? `session_${GLOBAL_SCOPE.crypto.randomUUID()}`
          : `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        storage?.setItem('errorSessionId', sessionId);
      }
      return sessionId;
    } catch {
      if (GLOBAL_SCOPE.crypto?.randomUUID) {
        return `session_${GLOBAL_SCOPE.crypto.randomUUID()}`;
      }
      return `session_${Date.now()}`;
    }
  }

  /**
   * * Gets the current user ID for error tracking context
   * @returns {string|null} User ID or null if not available
   * @private
   */
  static getUserId() {
    try {
      return GLOBAL_SCOPE.localStorage?.getItem('catNamesUser') ?? null;
    } catch {
      return null;
    }
  }

  /**
   * * Maps internal severity levels to Sentry levels
   * @param {string} severity - Internal severity level
   * @returns {string} Sentry-compatible level
   * @private
   */
  static mapSeverityToSentryLevel(severity) {
    const mapping = {
      [ERROR_SEVERITY.LOW]: 'info',
      [ERROR_SEVERITY.MEDIUM]: 'warning',
      [ERROR_SEVERITY.HIGH]: 'error',
      [ERROR_SEVERITY.CRITICAL]: 'fatal'
    };
    return mapping[severity] || 'error';
  }

  /**
   * * Creates a retry wrapper for async operations
   * @param {Function} operation - Async operation to retry
   * @param {Object} options - Retry options
   * @returns {Function} Wrapped function with retry logic
   */
  static withRetry(operation, options = {}) {
    const config = { ...RETRY_CONFIG, ...options };
    const {
      maxAttempts = config.maxAttempts,
      baseDelay = config.baseDelay,
      backoffMultiplier = config.backoffMultiplier,
      jitter = config.jitter,
      shouldRetry = (error) => this.isRetryable(this.parseError(error), {})
    } = config;

    return async (...args) => {
      let lastError;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await operation(...args);
        } catch (error) {
          lastError = error;

          if (attempt === maxAttempts || !shouldRetry(error)) {
            throw error;
          }

          // * Wait before retrying with exponential backoff and jitter
          const exponentialDelay = baseDelay * backoffMultiplier ** (attempt - 1);
          const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
          const jitterRange = cappedDelay * jitter;
          const jitterValue = (Math.random() - 0.5) * jitterRange;
          const waitTime = Math.max(0, cappedDelay + jitterValue);

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      throw lastError;
    };
  }

  /**
   * * Circuit breaker implementation
   */
  static get CircuitBreaker() {
    return class {
    constructor(failureThreshold = 5, resetTimeout = 60000) {
      this.failureThreshold = failureThreshold;
      this.resetTimeout = resetTimeout;
      this.failureCount = 0;
      this.lastFailureTime = null;
      this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }

    async execute(fn) {
      if (this.state === 'OPEN') {
        if (this.shouldAttemptReset()) {
          this.state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN - service is unavailable');
        }
      }

      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }

    onSuccess() {
      this.failureCount = 0;
      this.state = 'CLOSED';
      this.lastFailureTime = null;
    }

    onFailure() {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
      }
    }

    shouldAttemptReset() {
      if (!this.lastFailureTime) return false;
      return Date.now() - this.lastFailureTime >= this.resetTimeout;
    }

    getStatus() {
      return {
        state: this.state,
        failureCount: this.failureCount,
        failureThreshold: this.failureThreshold,
        lastFailureTime: this.lastFailureTime,
        timeUntilReset: this.lastFailureTime
          ? Math.max(0, this.resetTimeout - (Date.now() - this.lastFailureTime))
          : 0
      };
    }

    reset() {
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.lastFailureTime = null;
    }
    };
  }

  /**
   * * Create a retry wrapper with circuit breaker
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Options for retry and circuit breaker
   * @returns {Function} Wrapped function with retry and circuit breaker
   */
  static createResilientFunction(fn, options = {}) {
    const circuitBreaker = new this.CircuitBreaker(
      options.failureThreshold ?? 5,
      options.resetTimeout ?? 60000
    );

    return async (...args) => {
      return circuitBreaker.execute(() => this.withRetry(() => fn(...args), options));
    };
  }

  /**
   * * Global error handler setup
   */
  static setupGlobalErrorHandling() {
    if (!GLOBAL_SCOPE.addEventListener) {
      return;
    }

    // Handle unhandled promise rejections
    const rejectionHandler = (event) => {
      event.preventDefault();
      this.handleError(event.reason, 'Unhandled Promise Rejection', {
        isRetryable: false,
        affectsUserData: false,
        isCritical: true
      });
    };
    GLOBAL_SCOPE.addEventListener('unhandledrejection', rejectionHandler);

    // Handle unhandled errors
    const errorHandler = (event) => {
      event.preventDefault();
      this.handleError(event.error, 'Unhandled Error', {
        isRetryable: false,
        affectsUserData: false,
        isCritical: true
      });
    };
    GLOBAL_SCOPE.addEventListener('error', errorHandler);

    return () => {
      GLOBAL_SCOPE.removeEventListener?.('unhandledrejection', rejectionHandler);
      GLOBAL_SCOPE.removeEventListener?.('error', errorHandler);
    };
  }

  /**
   * * Get CSS class name for error severity
   * @param {string} severity - The error severity level
   * @param {Object} styles - The styles object containing severity classes
   * @returns {string} CSS class name for the severity
   */
  static getSeverityClass(severity, styles) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return styles.critical;
      case ERROR_SEVERITY.HIGH:
        return styles.high;
      case ERROR_SEVERITY.MEDIUM:
        return styles.medium;
      case ERROR_SEVERITY.LOW:
        return styles.low;
      default:
        return styles.unknown || styles.medium;
    }
  }

  /**
   * * Create a standardized error object
   * @param {Error|Object} error - The original error
   * @param {string} context - Where the error occurred
   * @param {Object} additionalInfo - Additional context
   * @returns {Object} Standardized error object
   */
  static createStandardizedError(
    error,
    context = 'Unknown',
    additionalInfo = {},
    timestamp = Date.now()
  ) {
    const errorInfo = this.handleError(error, context, additionalInfo);

    return {
      ...errorInfo,
      originalError: error,
      context,
      timestamp: new Date(timestamp).toISOString(),
      retry: () => {
        if (errorInfo.isRetryable) {
          GLOBAL_SCOPE.location?.reload?.();
        }
      },
    };
  }
}

// * Convenience functions for backward compatibility
export const handleError = (error, context, metadata) => ErrorManager.handleError(error, context, metadata);
export const withRetry = (operation, options) => ErrorManager.withRetry(operation, options);
export const createResilientFunction = (fn, options) => ErrorManager.createResilientFunction(fn, options);
export const setupGlobalErrorHandling = () => ErrorManager.setupGlobalErrorHandling();
export const getSeverityClass = (severity, styles) => ErrorManager.getSeverityClass(severity, styles);
export const createStandardizedError = (
  error,
  context,
  additionalInfo,
  timestamp
) =>
  ErrorManager.createStandardizedError(
    error,
    context,
    additionalInfo,
    timestamp
  );

export default ErrorManager;
