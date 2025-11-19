/**
 * @module authUtils
 * @description Utilities for authentication and authorization checks with role-based access control
 */

import { resolveSupabaseClient } from "@/integrations/supabase/client";

/**
 * User roles hierarchy (higher number = more permissions)
 */
export const USER_ROLES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

const ROLE_PRIORITY = {
  [USER_ROLES.USER]: 0,
  [USER_ROLES.MODERATOR]: 1,
  [USER_ROLES.ADMIN]: 2,
};

const ROLE_SOURCES = ["user_roles", "cat_app_users"];

const clientStateMap = new WeakMap();

const getClientState = (client) => {
  if (!client || (typeof client !== "object" && typeof client !== "function")) {
    return {
      canUseRoleRpc: false,
      preferredRoleSource: ROLE_SOURCES[0],
      disabledSources: new Set(),
    };
  }

  let state = clientStateMap.get(client);

  if (!state) {
    state = {
      canUseRoleRpc: true,
      preferredRoleSource: ROLE_SOURCES[0],
      disabledSources: new Set(),
    };
    clientStateMap.set(client, state);
  }

  return state;
};

const markSourceSuccessful = (state, source) => {
  if (!state) return;
  state.disabledSources.delete(source);
  state.preferredRoleSource = source;
};

const markSourceUnavailable = (state, source) => {
  if (!state) return;
  state.disabledSources.add(source);

  if (state.preferredRoleSource === source) {
    const fallback = ROLE_SOURCES.find(
      (candidate) =>
        candidate !== source && !state.disabledSources.has(candidate),
    );

    if (fallback) {
      state.preferredRoleSource = fallback;
    }
  }
};

const getRoleSourceOrder = (state) => {
  if (!state) return [...ROLE_SOURCES];

  const orderedSources = new Set();

  const preferred =
    state.preferredRoleSource &&
    !state.disabledSources.has(state.preferredRoleSource)
      ? state.preferredRoleSource
      : ROLE_SOURCES.find((source) => !state.disabledSources.has(source));

  if (preferred) {
    orderedSources.add(preferred);
  } else if (state.preferredRoleSource) {
    orderedSources.add(state.preferredRoleSource);
  }

  for (const source of ROLE_SOURCES) {
    if (!state.disabledSources.has(source)) {
      orderedSources.add(source);
    }
  }

  for (const source of ROLE_SOURCES) {
    orderedSources.add(source);
  }

  return [...orderedSources];
};

const normalizeStatusCode = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericMatch = value.match(/\d{3}/);
    if (numericMatch) {
      return Number.parseInt(numericMatch[0], 10);
    }
  }

  return null;
};

const extractErrorMetadata = (error) => {
  const statuses = new Set();
  const codes = new Set();
  const messages = new Set();

  const stack = [error];
  const visited = new Set();

  while (stack.length) {
    const current = stack.pop();

    if (current == null) {
      continue;
    }

    if (typeof current === "string") {
      messages.add(current);
      continue;
    }

    if (typeof current !== "object") {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      for (const entry of current) {
        stack.push(entry);
      }
      continue;
    }

    const candidateStatuses = [
      current.status,
      current.statusCode,
      current.status_code,
      current.responseStatus,
      current.statusText,
      current.response?.status,
      current.response?.statusCode,
      current.response?.status_code,
      current.response?.response?.status,
      current.response?.error?.status,
      current.error?.status,
      current.error?.statusCode,
      current.error?.status_code,
      current.originalError?.status,
      current.originalError?.statusCode,
      current.originalError?.status_code,
      current.data?.status,
      current.data?.statusCode,
      current.data?.status_code,
    ];

    for (const candidate of candidateStatuses) {
      const normalized = normalizeStatusCode(candidate);
      if (normalized != null) {
        statuses.add(normalized);
      }
    }

    const candidateCodes = [
      current.code,
      current.sqlState,
      current.error?.code,
      current.response?.code,
      current.response?.error?.code,
      current.data?.code,
      current.originalError?.code,
    ];

    for (const candidate of candidateCodes) {
      if (candidate == null) continue;
      const normalized = String(candidate).trim().toUpperCase();
      if (normalized) {
        codes.add(normalized);
      }
    }

    const messageKeys = [
      "message",
      "error",
      "error_description",
      "errorMessage",
      "error_message",
      "hint",
      "details",
      "detail",
      "description",
      "body",
      "msg",
      "responseText",
    ];

    for (const key of messageKeys) {
      const value = current[key];
      if (typeof value === "string") {
        messages.add(value);
      }
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === "object") {
        stack.push(value);
      } else if (typeof value === "string") {
        messages.add(value);
      }
    }
  }

  return {
    statuses: [...statuses],
    codes: [...codes],
    messages: [...messages].map((message) => message.toLowerCase()),
  };
};

const normalizeRole = (role) => role?.toLowerCase?.() ?? null;

const isMissingResourceError = (error) => {
  if (!error) return false;
  const { statuses, codes, messages } = extractErrorMetadata(error);

  const normalizedStatuses = statuses
    .map((value) => normalizeStatusCode(value))
    .filter((value) => value != null);

  const normalizedCodes = codes
    .map((value) => String(value).trim().toUpperCase())
    .filter((value) => value.length > 0);

  const statusIndicatesMissing = normalizedStatuses.some(
    (value) => value === 404 || value === 410,
  );

  const knownMissingCodes = new Set([
    "404",
    "PGRST301",
    "PGRST303",
    "PGRST304",
    "PGRST404",
    "42P01",
    "42704",
    "42883",
  ]);

  const codeIndicatesMissing = normalizedCodes.some((value) =>
    knownMissingCodes.has(value),
  );

  const missingMessagePatterns = [
    "does not exist",
    "not found",
    "missing from the schema",
    "undefined table",
    "undefined function",
    "unknown function",
    "no function matches the given name and argument types",
    'relation "',
  ];

  const messageIndicatesMissing = messages.some((message) =>
    missingMessagePatterns.some((pattern) => message.includes(pattern)),
  );

  return (
    statusIndicatesMissing || codeIndicatesMissing || messageIndicatesMissing
  );
};

const isRpcParameterMismatchError = (error) => {
  if (!error) return false;

  const { codes, messages } = extractErrorMetadata(error);

  const mismatchCodes = new Set(["42883", "42703"]);

  if (codes.some((value) => mismatchCodes.has(value))) {
    return true;
  }

  const parameterMismatchPatterns = [
    "missing required input parameter",
    "unexpected parameter",
    "unexpected key",
    "invalid parameter",
    "invalid input syntax",
    "required parameter",
    "function has_role(",
  ];

  return messages.some((message) =>
    parameterMismatchPatterns.some((pattern) => message.includes(pattern)),
  );
};

const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const compareRoles = (currentRole, requiredRole) => {
  const current = ROLE_PRIORITY[normalizeRole(currentRole)] ?? -1;
  const required =
    ROLE_PRIORITY[normalizeRole(requiredRole)] ?? Number.POSITIVE_INFINITY;

  return current >= required;
};

const fetchRoleFromSource = async (activeSupabase, userName, source, state) => {
  if (!activeSupabase) return { role: null, handled: true };

  const trimmedUserName = userName.trim?.() ?? userName;

  if (source === "user_roles") {
    const { data, error } = await activeSupabase
      .from("user_roles")
      .select("role")
      .eq("user_name", trimmedUserName)
      .order("role", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingResourceError(error)) {
        markSourceUnavailable(state, source);
        return { role: null, handled: true };
      }
      throw error;
    }

    markSourceSuccessful(state, source);

    return { role: data?.role ?? null, handled: false };
  }

  const { data, error } = await activeSupabase
    .from("cat_app_users")
    .select("user_role")
    .eq("user_name", trimmedUserName)
    .maybeSingle();

  if (error) {
    if (isMissingResourceError(error)) {
      markSourceUnavailable(state, source);
      return { role: null, handled: true };
    }
    throw error;
  }

  markSourceSuccessful(state, source);

  return { role: data?.user_role ?? null, handled: false };
};

const fetchUserRole = async (activeSupabase, userName) => {
  const state = getClientState(activeSupabase);
  const sources = getRoleSourceOrder(state);

  for (const source of sources) {
    try {
      const result = await fetchRoleFromSource(
        activeSupabase,
        userName,
        source,
        state,
      );
      if (result?.handled) {
        continue;
      }
      if (result?.role) {
        return normalizeRole(result.role);
      }
    } catch (error) {
      console.error(
        `Error fetching user role from Supabase source "${source}":`,
        error,
      );
      continue;
    }
  }

  return null;
};

/**
 * Checks if a user has admin privileges using role-based authentication
 * @param {string} userIdOrName - The user ID or username to check
 * @returns {Promise<boolean>} True if user is an admin
 */
export async function isUserAdmin(userIdOrName) {
  return hasRole(userIdOrName, USER_ROLES.ADMIN);
}

/**
 * Checks if a user has a specific role or higher
 * @param {string} userName - The username to check
 * @param {string} requiredRole - The minimum role required
 * @returns {Promise<boolean>} True if user has the required role or higher
 */
export async function hasRole(userName, requiredRole) {
  if (!userName || !requiredRole) return false;

  const activeSupabase = await resolveSupabaseClient();

  if (!activeSupabase) {
    console.warn(
      "Supabase client is not configured. Role check will default to false.",
    );
    return false;
  }

  try {
    const trimmedUserName = userName.trim?.() ?? userName;
    const normalizedRequiredRole = normalizeRole(requiredRole);
    const state = getClientState(activeSupabase);

    if (!normalizedRequiredRole) {
      return false;
    }

    if (state?.canUseRoleRpc) {
      const rpcPayloads = [
        { _user_name: trimmedUserName, _role: normalizedRequiredRole },
      ];

      if (isUuid(trimmedUserName)) {
        rpcPayloads.push({
          _user_id: trimmedUserName,
          _role: normalizedRequiredRole,
        });
      }

      let lastRpcError = null;

      for (const payload of rpcPayloads) {
        const { data, error } = await activeSupabase.rpc("has_role", payload);

        if (!error) {
          return data === true;
        }

        lastRpcError = error;

        if (isRpcParameterMismatchError(error)) {
          continue;
        }

        if (isMissingResourceError(error)) {
          state.canUseRoleRpc = false;
          break;
        }

        throw error;
      }

      if (lastRpcError && isMissingResourceError(lastRpcError)) {
        state.canUseRoleRpc = false;
      }
    }

    const userRole = await fetchUserRole(activeSupabase, trimmedUserName);
    if (!userRole) {
      return false;
    }

    return compareRoles(userRole, normalizedRequiredRole);
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Gets the current user's role
 * @param {string} userName - The username to check
 * @returns {Promise<string|null>} The user's role or null if not found
 */
export async function getUserRole(userName) {
  if (!userName) return null;

  const activeSupabase = await resolveSupabaseClient();

  if (!activeSupabase) {
    console.warn("Supabase client is not configured. Using default user role.");
    return USER_ROLES.USER;
  }

  try {
    const trimmedUserName = userName.trim?.() ?? userName;
    const role = await fetchUserRole(activeSupabase, trimmedUserName);

    return role ?? USER_ROLES.USER;
  } catch (error) {
    console.error("Error getting user role:", error);
    return USER_ROLES.USER;
  }
}

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
};
