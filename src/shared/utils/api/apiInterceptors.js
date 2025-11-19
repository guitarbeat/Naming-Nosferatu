/**
 * @module api/apiInterceptors
 * @description Request, response, and error interceptor utilities
 */

import { apiRequest } from "./apiCore";

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
