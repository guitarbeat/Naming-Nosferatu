/**
 * @module authUtils
 * @description Utilities for authentication and authorization checks with role-based access control
 * Re-exports from modular auth utilities for backward compatibility
 */

// * Re-export constants
export { USER_ROLES } from "./auth/authConstants";

// * Re-export API functions
export {
  isUserAdmin,
  hasRole,
  getUserRole,
} from "./auth/authApi";

// * Re-export validation utilities (if needed externally)
export { normalizeRole, compareRoles } from "./auth/authValidation";

/**
 * Gets the current authentication configuration
 * @returns {Object} Authentication configuration object
 */
export function getAuthConfig() {
  return {
    isRoleBased: true,
    supportedRoles: Object.values(USER_ROLES),
    version: "3.0.0",
    usesSupabaseAuth: true,
  };
}

export default {
  isUserAdmin,
  hasRole,
  getUserRole,
  getAuthConfig,
  USER_ROLES,
};
