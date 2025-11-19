/**
 * @module apiUtils
 * @description Consolidated API utilities for consistent data fetching and error handling.
 * Reduces duplication in API calls across the application.
 */

import { API, ERROR_TYPES } from "../../core/constants";
import { ErrorManager } from "../services/errorManager";

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

/**
 * * Determines if an error should trigger a retry
 * @param {Error} error - Error to check
 * @returns {boolean} Whether to retry
 */
function shouldRetry(error) {
  // Don't retry on client errors (4xx) except 408, 429
  if (error.status >= 400 && error.status < 500) {
    return error.status === 408 || error.status === 429;
  }

  // Retry on server errors (5xx) and network errors
  return error.status >= 500 || !error.status;
}

/**
 * * GET request helper
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
export async function apiGet(url, options = {}) {
  return apiRequest(url, { ...options, method: "GET" });
}

/**
 * * POST request helper
 * @param {string} url - Request URL
 * @param {Object} body - Request body
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
export async function apiPost(url, body, options = {}) {
  return apiRequest(url, { ...options, method: "POST", body });
}

/**
 * * PUT request helper
 * @param {string} url - Request URL
 * @param {Object} body - Request body
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
export async function apiPut(url, body, options = {}) {
  return apiRequest(url, { ...options, method: "PUT", body });
}

/**
 * * PATCH request helper
 * @param {string} url - Request URL
 * @param {Object} body - Request body
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
export async function apiPatch(url, body, options = {}) {
  return apiRequest(url, { ...options, method: "PATCH", body });
}

/**
 * * DELETE request helper
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
export async function apiDelete(url, options = {}) {
  return apiRequest(url, { ...options, method: "DELETE" });
}

/**
 * * Creates a standardized API client
 * @param {string} baseURL - Base URL for all requests
 * @param {Object} defaultOptions - Default options for all requests
 * @returns {Object} API client with methods
 */
export function createApiClient(baseURL, defaultOptions = {}) {
  const request = (endpoint, options = {}) => {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseURL}${endpoint}`;
    return apiRequest(url, { ...defaultOptions, ...options });
  };

  return {
    get: (endpoint, options) =>
      request(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options) =>
      request(endpoint, { ...options, method: "POST", body }),
    put: (endpoint, body, options) =>
      request(endpoint, { ...options, method: "PUT", body }),
    patch: (endpoint, body, options) =>
      request(endpoint, { ...options, method: "PATCH", body }),
    delete: (endpoint, options) =>
      request(endpoint, { ...options, method: "DELETE" }),
  };
}

/**
 * * Creates a standardized Supabase API client
 * @param {Object} supabaseClient - Supabase client instance
 * @returns {Object} Supabase API client with error handling
 */
export function createSupabaseApiClient(supabaseClient) {
  const handleSupabaseResponse = async (response) => {
    if (response.error) {
      throw new ErrorManager({
        message: response.error.message,
        code: response.error.code,
        details: response.error.details,
        hint: response.error.hint,
        type: ERROR_TYPES.DATABASE,
      });
    }
    return response.data;
  };

  return {
    async get(table, options = {}) {
      const { select = "*", filters = {}, orderBy, limit, offset } = options;

      let query = supabaseClient.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        const { column, ascending = true } = orderBy;
        query = query.order(column, { ascending });
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const response = await query;
      return handleSupabaseResponse(response);
    },

    async create(table, data) {
      const response = await supabaseClient.from(table).insert(data);
      return handleSupabaseResponse(response);
    },

    async update(table, data, filters) {
      let query = supabaseClient.from(table).update(data);

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const response = await query;
      return handleSupabaseResponse(response);
    },

    async delete(table, filters) {
      let query = supabaseClient.from(table).delete();

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const response = await query;
      return handleSupabaseResponse(response);
    },

    async rpc(functionName, params = {}) {
      const response = await supabaseClient.rpc(functionName, params);
      return handleSupabaseResponse(response);
    },
  };
}

/**
 * * Creates a standardized cache manager
 * @param {Object} options - Cache options
 * @returns {Object} Cache manager
 */
export function createCacheManager(options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
  } = options;

  const cache = new Map();
  const timestamps = new Map();

  const isExpired = (key) => {
    const timestamp = timestamps.get(key);
    return !timestamp || Date.now() - timestamp > ttl;
  };

  const get = (key) => {
    if (isExpired(key)) {
      cache.delete(key);
      timestamps.delete(key);
      return null;
    }
    return cache.get(key);
  };

  const set = (key, value) => {
    // Remove oldest entries if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
      timestamps.delete(firstKey);
    }

    cache.set(key, value);
    timestamps.set(key, Date.now());
  };

  const clear = () => {
    cache.clear();
    timestamps.clear();
  };

  const has = (key) => {
    return cache.has(key) && !isExpired(key);
  };

  return {
    get,
    set,
    has,
    clear,
    size: () => cache.size,
  };
}

/**
 * * Creates a standardized request interceptor
 * @param {Function} interceptor - Interceptor function
 * @returns {Function} Wrapped request function
 */
export function createRequestInterceptor(interceptor) {
  return async (url, options) => {
    const modifiedOptions = await interceptor(url, options);
    return apiRequest(url, modifiedOptions);
  };
}

/**
 * * Creates a standardized response interceptor
 * @param {Function} interceptor - Interceptor function
 * @returns {Function} Wrapped request function
 */
export function createResponseInterceptor(interceptor) {
  return async (url, options) => {
    const response = await apiRequest(url, options);
    return await interceptor(response);
  };
}

/**
 * * Creates a standardized error interceptor
 * @param {Function} interceptor - Interceptor function
 * @returns {Function} Wrapped request function
 */
export function createErrorInterceptor(interceptor) {
  return async (url, options) => {
    try {
      return await apiRequest(url, options);
    } catch (error) {
      const handledError = await interceptor(error);
      throw handledError;
    }
  };
}

export default {
  handleApiResponse,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  createApiClient,
  createSupabaseApiClient,
  createCacheManager,
  createRequestInterceptor,
  createResponseInterceptor,
  createErrorInterceptor,
};
