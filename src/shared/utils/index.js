/**
 * @module shared/utils
 * @description Consolidated exports for all shared utilities.
 * Provides a single import point for all utility functions and classes.
 */

import * as coreUtils from "./coreUtils";
import * as validationUtils from "./validationUtils";
import * as authUtils from "./authUtils";
import * as componentUtils from "./componentUtils";
import * as apiUtils from "./apiUtils";

// * Core utilities
export * from "./coreUtils";
export * from "./validationUtils";
export * from "./authUtils";

// * Component utilities
export * from "./componentUtils";

// * API utilities
export * from "./apiUtils";

// * Re-export commonly used utilities for convenience
export {
  shuffleArray,
  generatePairs,
  buildComparisonsMap,
  validateImageUrl,
  preloadImage,
  getFallbackImageUrl,
  compressImageFile,
  initializeSorterPairs,
  getPreferencesMap,
  computeRating,
  performanceMonitor,
  PerformanceMonitor,
  devLog,
  throttle,
  debounce,
  safeRequestAnimationFrame,
  batchDOMUpdates,
} from "./coreUtils";

export {
  validateUsername,
  validateCatName,
  validateDescription,
  validateTournamentSize,
  validateRating,
  validateEmail,
  validateForm,
  validateName,
  validateGeneralDescription,
} from "./validationUtils";

export {
  isUserAdmin,
  hasRole,
  getUserRole,
  getAuthConfig,
  USER_ROLES,
} from "./authUtils";

export {
  useFormState,
  useLoadingState,
  useErrorState,
  useAsyncOperation,
  useDebounce,
  useThrottle,
  useClickOutside,
  useKeyboardHandler,
  useFocusManager,
  useVisibilityManager,
  useMediaQuery,
  usePrevious,
  useForceUpdate,
} from "./componentUtils";

export {
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
} from "./apiUtils";

// * Default export with all utilities
const combinedUtils = {
  ...coreUtils,
  ...validationUtils,
  ...authUtils,
  ...componentUtils,
  ...apiUtils,
};

export default combinedUtils;
