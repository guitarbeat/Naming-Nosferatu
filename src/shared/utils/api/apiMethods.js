/**
 * @module api/apiMethods
 * @description HTTP method helper functions
 */

import { apiRequest } from "./apiCore";

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
