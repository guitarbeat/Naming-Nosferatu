/**
 * @module auth/authApi
 * @description API functions for authentication and role management
 */

import { resolveSupabaseClient } from "@/integrations/supabase/client";
import { USER_ROLES, ROLE_SOURCES } from "./authConstants";
import { normalizeRole, compareRoles } from "./authValidation";
import {
  isMissingResourceError,
  isRpcParameterMismatchError,
  isUuid,
} from "./authErrorHandling";

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
      if (process.env.NODE_ENV === "development") {
        console.error(
          `Error fetching user role from Supabase source "${source}":`,
          error,
        );
      }
      continue;
    }
  }

  return null;
};

/**
 * Checks if a user has a specific role or higher (unused - kept for potential future use)
 * @param {string} userName - The username to check
 * @param {string} requiredRole - The minimum role required
 * @returns {Promise<boolean>} True if user has the required role or higher
 */
// export async function hasRole(userName, requiredRole) {
async function _hasRole(userName, requiredRole) {
  if (!userName || !requiredRole) return false;

  const activeSupabase = await resolveSupabaseClient();

  if (!activeSupabase) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase client is not configured. Role check will default to false.",
      );
    }
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
    if (process.env.NODE_ENV === "development") {
      console.error("Error checking user role:", error);
    }
    return false;
  }
}

/**
 * Checks if a user has admin privileges using role-based authentication
 * @param {string} userIdOrName - The user ID or username to check
 * @returns {Promise<boolean>} True if user is an admin
 */
export async function isUserAdmin(userIdOrName) {
  return _hasRole(userIdOrName, USER_ROLES.ADMIN);
}

