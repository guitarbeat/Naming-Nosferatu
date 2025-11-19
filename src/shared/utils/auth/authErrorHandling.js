/**
 * @module auth/authErrorHandling
 * @description Error handling utilities for authentication operations
 */

/**
 * Normalizes status code from various error formats
 * @param {any} value - Status code value
 * @returns {number|null} Normalized status code or null
 */
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

/**
 * Extracts error metadata from error objects
 * @param {Error|Object|string} error - Error to extract metadata from
 * @returns {Object} Object with statuses, codes, and messages arrays
 */
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

/**
 * Checks if error indicates a missing resource
 * @param {Error|Object} error - Error to check
 * @returns {boolean} True if error indicates missing resource
 */
export const isMissingResourceError = (error) => {
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
export const isRpcParameterMismatchError = (error) => {
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
export const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
