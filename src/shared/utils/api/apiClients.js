/**
 * @module api/apiClients
 * @description API client factory functions
 */

import { apiRequest } from "./apiCore";
import { ERROR_TYPES } from "../../../core/constants";
import { ErrorManager } from "../../services/errorManager";

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
