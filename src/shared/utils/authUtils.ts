/**
 * @module authUtils
 * @description Consolidated authentication utilities including constants, validation, error handling, and API functions
 */

import { resolveSupabaseClient } from "../services/supabase/supabaseClient";

// ============================================================================
// Constants
// ============================================================================

/**
 * User roles hierarchy (higher number = more permissions)
 */
const USER_ROLES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

const ROLE_SOURCES = ["user_roles"];

// ============================================================================
// Validation Utilities
// ============================================================================

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
const normalizeRole = (role: string | null | undefined): string | null =>
  role?.toLowerCase?.() ?? null;

/**
 * Compares two roles to determine if current role meets required role
 * @param {string} currentRole - Current user role
 * @param {string} requiredRole - Required role
 * @returns {boolean} True if current role meets or exceeds required role
 */
const compareRoles = (
  currentRole: string | null | undefined,
  requiredRole: string | null | undefined,
): boolean => {
  const current =
    ROLE_PRIORITY[normalizeRole(currentRole) as keyof typeof ROLE_PRIORITY] ??
    -1;
  const required =
    ROLE_PRIORITY[normalizeRole(requiredRole) as keyof typeof ROLE_PRIORITY] ??
    Number.POSITIVE_INFINITY;

  return current >= required;
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Normalizes status code from various error formats
 * @param {any} value - Status code value
 * @returns {number|null} Normalized status code or null
 */
const normalizeStatusCode = (value: unknown): number | null => {
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

/**
 * Extracts error metadata from error objects
 * @param {Error|Object|string} error - Error to extract metadata from
 * @returns {Object} Object with statuses, codes, and messages arrays
 */
const extractErrorMetadata = (error: unknown) => {
  const statuses = new Set<number>();
  const codes = new Set<string>();
  const messages = new Set<string>();

  const stack = [error];
  const visited = new Set<unknown>();

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

    const obj = current as Record<string, unknown>;
    const candidateStatuses = [
      obj.status,
      obj.statusCode,
      obj.status_code,
      obj.responseStatus,
      obj.statusText,
      (obj.response as Record<string, unknown>)?.status,
      (obj.response as Record<string, unknown>)?.statusCode,
      (obj.response as Record<string, unknown>)?.status_code,
      (
        (obj.response as Record<string, unknown>)?.response as Record<
          string,
          unknown
        >
      )?.status,
      (
        (obj.response as Record<string, unknown>)?.error as Record<
          string,
          unknown
        >
      )?.status,
      (obj.error as Record<string, unknown>)?.status,
      (obj.error as Record<string, unknown>)?.statusCode,
      (obj.error as Record<string, unknown>)?.status_code,
      (obj.originalError as Record<string, unknown>)?.status,
      (obj.originalError as Record<string, unknown>)?.statusCode,
      (obj.originalError as Record<string, unknown>)?.status_code,
      (obj.data as Record<string, unknown>)?.status,
      (obj.data as Record<string, unknown>)?.statusCode,
      (obj.data as Record<string, unknown>)?.status_code,
    ];

    for (const candidate of candidateStatuses) {
      const normalized = normalizeStatusCode(candidate);
      if (normalized != null) {
        statuses.add(normalized);
      }
    }

    const candidateCodes = [
      obj.code,
      obj.sqlState,
      (obj.error as Record<string, unknown>)?.code,
      (obj.response as Record<string, unknown>)?.code,
      (
        (obj.response as Record<string, unknown>)?.error as Record<
          string,
          unknown
        >
      )?.code,
      (obj.data as Record<string, unknown>)?.code,
      (obj.originalError as Record<string, unknown>)?.code,
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
      const value = (current as Record<string, unknown>)[key];
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

/**
 * Checks if error indicates a missing resource
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if error indicates missing resource
 */
const isMissingResourceError = (error: unknown): boolean => {
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

/**
 * Checks if error indicates RPC parameter mismatch
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if error indicates parameter mismatch
 */
const isRpcParameterMismatchError = (error: unknown): boolean => {
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

/**
 * Checks if value is a valid UUID
 * @param {string} value - Value to check
 * @returns {boolean} True if value is a valid UUID
 */
const isUuid = (value: unknown): boolean =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

// ============================================================================
// API Functions
// ============================================================================

interface ClientState {
  canUseRoleRpc: boolean;
  preferredRoleSource: string;
  disabledSources: Set<string>;
}

const clientStateMap = new WeakMap<object, ClientState>();

const getClientState = (client: object | null) => {
  if (!client) {
    return {
      canUseRoleRpc: false,
      preferredRoleSource: ROLE_SOURCES[0],
      disabledSources: new Set<string>(),
    };
  }

  let state = clientStateMap.get(client);

  if (!state) {
    state = {
      canUseRoleRpc: true,
      preferredRoleSource: ROLE_SOURCES[0],
      disabledSources: new Set<string>(),
    };
    clientStateMap.set(client, state);
  }

  return state;
};

const markSourceSuccessful = (
  state: ClientState | undefined,
  source: string,
) => {
  if (!state) return;
  state.disabledSources.delete(source);
  state.preferredRoleSource = source;
};

const markSourceUnavailable = (
  state: ClientState | undefined,
  source: string,
) => {
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

const getRoleSourceOrder = (state: ClientState | undefined) => {
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

const handleRoleResponse = (
  data: Record<string, unknown> | null,
  error: unknown,
  source: string,
  state: ClientState | undefined,
  roleKey: string,
) => {
  if (error) {
    if (isMissingResourceError(error)) {
      markSourceUnavailable(state, source);
      return { role: null, handled: true };
    }
    throw error;
  }

  markSourceSuccessful(state, source);
  return { role: data?.[roleKey] ?? null, handled: false };
};

const fetchRoleFromSource = async (
  activeSupabase: unknown,
  userName: string,
  source: string,
  state: ClientState | undefined,
) => {
  // Type guard for Supabase client
  const hasFromMethod = (client: unknown): client is { from: (table: string) => unknown } => {
    return !!client && typeof client === 'object' && 'from' in client && typeof (client as { from?: unknown }).from === 'function';
  };

  if (!activeSupabase || !hasFromMethod(activeSupabase)) return { role: null, handled: true };

  const trimmedUserName = userName.trim?.() ?? userName;

  // Only query user_roles table (single source of truth)
  if (source === "user_roles") {
    const { data, error } = await (activeSupabase.from("user_roles") as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => {
              maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
            };
          };
        };
      };
    })
      .select("role")
      .eq("user_name", trimmedUserName)
      .order("role", { ascending: false })
      .limit(1)
      .maybeSingle();

    return handleRoleResponse(data, error, source, state, "role");
  }

  // No other sources supported
  return { role: null, handled: true };
};

const fetchUserRole = async (activeSupabase: unknown, userName: string) => {
  const state = getClientState(activeSupabase as object | null);
  const sources = getRoleSourceOrder(state);

  for (const source of sources) {
    try {
      const result = await fetchRoleFromSource(
        activeSupabase,
        userName,
        source as string,
        state,
      );
      if (result?.handled) {
        continue;
      }
      if (result?.role) {
        return normalizeRole(result.role as string);
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
 * Checks if a user has a specific role or higher
 * @param {string} userName - The username to check
 * @param {string} requiredRole - The minimum role required
 * @returns {Promise<boolean>} True if user has the required role or higher
 */
async function _hasRole(
  userName: string,
  requiredRole: string,
): Promise<boolean> {
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
      const rpcPayloads: Record<string, string>[] = [
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (activeSupabase as any).rpc(
          "has_role",
          payload,
        );

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
export async function isUserAdmin(userIdOrName: string): Promise<boolean> {
  return _hasRole(userIdOrName, USER_ROLES.ADMIN);
}
