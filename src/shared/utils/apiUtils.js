/**
 * @module apiUtils
 * @description Consolidated API utilities for consistent data fetching and error handling.
 * Re-exports from modular API utilities for backward compatibility.
 */

// * Import for default export
import { handleApiResponse, apiRequest } from "./api/apiCore";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api/apiMethods";
import { createApiClient, createSupabaseApiClient } from "./api/apiClients";
import { createCacheManager } from "./api/apiCache";
import {
  createRequestInterceptor,
  createResponseInterceptor,
  createErrorInterceptor,
} from "./api/apiInterceptors";

// * Re-export core API functions
export { handleApiResponse, apiRequest, shouldRetry } from "./api/apiCore";

// * Re-export HTTP method helpers
export { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api/apiMethods";

// * Re-export client factories
export { createApiClient, createSupabaseApiClient } from "./api/apiClients";

// * Re-export cache manager
export { createCacheManager } from "./api/apiCache";

// * Re-export interceptors
export {
  createRequestInterceptor,
  createResponseInterceptor,
  createErrorInterceptor,
} from "./api/apiInterceptors";

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
