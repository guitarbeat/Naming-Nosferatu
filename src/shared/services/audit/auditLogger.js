/**
 * @module auditLogger
 * @description Utility helpers for recording audit events to Supabase.
 */

import { resolveSupabaseClient } from "../supabase/client";
import { ErrorManager } from "../errorManager";

const AUDIT_TABLE = "audit_log";

/**
 * * Persist an audit event for security/compliance reporting.
 * @param {Object} params
 * @param {string} params.tableName - Logical area or table name
 * @param {string} params.operation - Operation identifier (e.g., theme_change)
 * @param {string} [params.userName] - Optional username performing the action
 * @param {Object} [params.details] - Additional JSON-serializable metadata
 * @param {Object} [params.previousState] - Optional previous state snapshot
 * @returns {Promise<boolean>} Whether the event was stored successfully
 */
export async function logAuditEvent({
  tableName,
  operation,
  userName = null,
  details = null,
  previousState = null,
}) {
  if (!tableName || !operation) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[auditLogger] Missing tableName or operation. Skipping audit insert.",
      );
    }
    return false;
  }

  try {
    const client = await resolveSupabaseClient();
    if (!client) {
      throw new Error("Supabase client is not initialized");
    }

    const payload = {
      table_name: tableName,
      operation,
      user_name: userName,
      new_values: details,
      old_values: previousState,
    };

    const { error } = await client.from(AUDIT_TABLE).insert(payload);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    ErrorManager.handleError(error, "Audit Logging Failure", {
      tableName,
      operation,
      isRetryable: false,
      affectsUserData: false,
    });
    return false;
  }
}

export default {
  logAuditEvent,
};
