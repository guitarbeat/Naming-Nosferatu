/**
 * @module auth/authValidation
 * @description Authentication validation utilities for role comparison and normalization
 */

import { USER_ROLES } from "./authConstants";

const ROLE_PRIORITY = {
  [USER_ROLES.USER]: 0,
  [USER_ROLES.MODERATOR]: 1,
  [USER_ROLES.ADMIN]: 2,
};

/**
 * Normalizes a role string to lowercase
 * @param {string} role - Role to normalize
 * @returns {string|null} Normalized role or null
 */
export const normalizeRole = (role) => role?.toLowerCase?.() ?? null;

/**
 * Compares two roles to determine if current role meets required role
 * @param {string} currentRole - Current user role
 * @param {string} requiredRole - Required role
 * @returns {boolean} True if current role meets or exceeds required role
 */
export const compareRoles = (currentRole, requiredRole) => {
  const current = ROLE_PRIORITY[normalizeRole(currentRole)] ?? -1;
  const required =
    ROLE_PRIORITY[normalizeRole(requiredRole)] ?? Number.POSITIVE_INFINITY;

  return current >= required;
};

