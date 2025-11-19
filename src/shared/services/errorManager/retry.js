/**
 * @module errorManager/retry
 * @description Retry logic and circuit breaker implementation.
 */

import { RETRY_CONFIG } from './constants';
import { parseError } from './errorParser';
import { isRetryable } from './errorFormatter';

/**
 * * Circuit breaker implementation
 */
export class CircuitBreaker {
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
}

/**
 * * Creates a retry wrapper for async operations
 * @param {Function} operation - Async operation to retry
 * @param {Object} options - Retry options
 * @returns {Function} Wrapped function with retry logic
 */
export function withRetry(operation, options = {}) {
  const config = { ...RETRY_CONFIG, ...options };
  const {
    maxAttempts = config.maxAttempts,
    baseDelay = config.baseDelay,
    backoffMultiplier = config.backoffMultiplier,
    jitter = config.jitter,
    shouldRetry = (error) => isRetryable(parseError(error), {})
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
 * * Create a retry wrapper with circuit breaker
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Options for retry and circuit breaker
 * @returns {Function} Wrapped function with retry and circuit breaker
 */
export function createResilientFunction(fn, options = {}) {
  const circuitBreaker = new CircuitBreaker(
    options.failureThreshold ?? 5,
    options.resetTimeout ?? 60000
  );

  return async (...args) => {
    return circuitBreaker.execute(() => withRetry(() => fn(...args), options));
  };
}

