/**
 * @module api/apiCore
 * @description Core API request and response handling utilities
 */

import { API, ERROR_TYPES } from "../../../core/constants";
import { ErrorManager } from "../../services/errorManager";

/**
 * * Standardized API response handler
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 */
export async function handleApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ErrorManager({
      message:
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      code: errorData.code,
      type: ERROR_TYPES.NETWORK,
    });
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

/**
 * * Determines if an error should trigger a retry
 * @param {Error} error - Error to check
 * @returns {boolean} Whether to retry
 */
export function shouldRetry(error) {
  // Don't retry on client errors (4xx) except 408, 429
  if (error.status >= 400 && error.status < 500) {
    return error.status === 408 || error.status === 429;
  }

  // Retry on server errors (5xx) and network errors
  return error.status >= 500 || !error.status;
}

/**
 * * Standardized API request function
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
export async function apiRequest(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    timeout = API.TIMEOUT,
    retries = API.RETRY_ATTEMPTS,
    retryDelay = API.RETRY_DELAY,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
    ...fetchOptions,
  };

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      return await handleApiResponse(response);
    } catch (error) {
      lastError = error;

      if (attempt < retries && shouldRetry(error)) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
