/**
 * @module auth/authConstants
 * @description Authentication constants and configuration
 */

/**
 * User roles hierarchy (higher number = more permissions)
 */
export const USER_ROLES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

export const ROLE_SOURCES = ["user_roles", "cat_app_users"];
