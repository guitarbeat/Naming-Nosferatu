/**
 * @module useProfileNameOperations
 * @description Custom hook for managing name operations (visibility, delete, bulk operations).
 */

import { useState, useCallback } from "react";
import { resolveSupabaseClient } from "../../../shared/services/supabase/client";
import {
  deleteName,
  hiddenNamesAPI,
} from "../../../shared/services/supabase/api";
import { devLog, devWarn, devError } from "../../../shared/utils/logger";
import { clearAllCaches } from "../../../shared/utils/cacheUtils";

/**
 * * Hook for managing name operations
 * @param {string} activeUser - Active user name
 * @param {boolean} canManageActiveUser - Whether user can manage active user
 * @param {Set} hiddenNames - Set of hidden name IDs
 * @param {Function} setHiddenNames - Function to set hidden names
 * @param {Function} setAllNames - Function to update all names
 * @param {Function} fetchNames - Function to refetch names
 * @param {Function} fetchSelectionStats - Function to refetch selection stats
 * @param {Function} showSuccess - Success notification function
 * @param {Function} showError - Error notification function
 * @returns {Object} Name operation handlers
 */
export function useProfileNameOperations(
  activeUser,
  canManageActiveUser,
  hiddenNames,
  setHiddenNames,
  setAllNames,
  fetchNames,
  fetchSelectionStats,
  showSuccess,
  showError,
) {
  const [selectedNames, setSelectedNames] = useState(new Set());

  // * Handle name visibility toggle
  const handleToggleVisibility = useCallback(
    async (nameId) => {
      try {
        const currentlyHidden = hiddenNames.has(nameId);

        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          devWarn("Supabase not configured, cannot toggle visibility");
          showError("Database not available");
          return;
        }

        if (!canManageActiveUser) {
          showError("Only admins can change visibility");
          return;
        }

        if (currentlyHidden) {
          await hiddenNamesAPI.unhideName(activeUser, nameId);
          showSuccess("Unhidden");
        } else {
          await hiddenNamesAPI.hideName(activeUser, nameId);
          showSuccess("Hidden");
        }

        // * Debug logging for visibility toggle
        devLog(
          `🔍 Toggled visibility for name ${nameId}: ${currentlyHidden ? "unhidden" : "hidden"} for user: ${activeUser}`,
        );

        // Optimistic local update for instant UI feedback
        setHiddenNames((prev) => {
          const next = new Set(prev);
          if (currentlyHidden) next.delete(nameId);
          else next.add(nameId);
          return next;
        });

        // Immediately reflect hidden state in local names collection
        setAllNames((prev) =>
          Array.isArray(prev)
            ? prev.map((n) =>
                n.id === nameId ? { ...n, isHidden: !currentlyHidden } : n,
              )
            : prev,
        );

        // Reload hidden names from database to ensure persistence
        // Global hidden names are stored in cat_name_options.is_hidden (admin-only)
        const { data: globalHiddenData, error: globalHiddenError } =
          await supabaseClient
            .from("cat_name_options")
            .select("id")
            .eq("is_hidden", true);

        if (!globalHiddenError && globalHiddenData) {
          const hiddenIds = new Set(globalHiddenData.map((r) => r.id));
          setHiddenNames(hiddenIds);
        }

        // * Clear caches to ensure hidden names don't appear in tournaments
        clearAllCaches();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        devError("Profile - Toggle Visibility error:", errorMessage);
        showError(`Failed to update visibility: ${errorMessage}`);
      }
    },
    [
      hiddenNames,
      activeUser,
      showSuccess,
      showError,
      canManageActiveUser,
      setHiddenNames,
      setAllNames,
    ],
  );

  // * Handle name deletion
  const handleDelete = useCallback(
    async (name) => {
      try {
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          devWarn("Supabase not configured, cannot delete name");
          showError("Database not available");
          return;
        }

        if (!canManageActiveUser) {
          showError("Only admins can delete names");
          return;
        }

        const { error } = await deleteName(name.id);
        if (error) throw error;

        // * Refresh names and selection stats
        fetchNames(activeUser);
        fetchSelectionStats(activeUser);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        devError("Profile - Delete Name error:", errorMessage);
        showError(`Failed to delete name: ${errorMessage}`);
      }
    },
    [
      fetchNames,
      fetchSelectionStats,
      showError,
      canManageActiveUser,
      activeUser,
    ],
  );

  // * Handle name selection
  const handleSelectionChange = useCallback((nameId, selected) => {
    setSelectedNames((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(nameId);
      } else {
        newSet.delete(nameId);
      }
      return newSet;
    });
  }, []);

  // * Helper for bulk operations
  const performBulkOperation = useCallback(
    async (nameIds, operation, successMessage, isHide) => {
      devLog("[useProfileNameOperations] performBulkOperation called", {
        nameIds,
        nameIdsLength: nameIds?.length,
        isHide,
        activeUser,
        canManageActiveUser,
      });

      try {
        if (!nameIds || nameIds.length === 0) {
          devWarn("[useProfileNameOperations] No nameIds provided");
          showError("No names to process");
          return;
        }

        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          devWarn("Supabase not configured, cannot perform bulk operation");
          showError("Database not available");
          return;
        }

        if (!canManageActiveUser) {
          const action = isHide ? "hide" : "unhide";
          const errorMsg = `Only admins can ${action} names`;
          devWarn("[useProfileNameOperations]", errorMsg);
          showError(errorMsg);
          return;
        }

        devLog("[useProfileNameOperations] Calling operation with:", {
          activeUser,
          nameIdsCount: nameIds.length,
          nameIds,
        });

        const result = await operation(activeUser, nameIds);

        devLog("[useProfileNameOperations] Operation result:", result);

        if (result.success && result.processed > 0) {
          const action = isHide ? "hidden" : "unhidden";
          const count = result.processed;
          const message = `✅ Successfully ${action} ${count} name${count !== 1 ? "s" : ""}`;

          // Show clear success feedback (showSuccess already calls showToast internally)
          showSuccess(message);

          // Update local state optimistically
          setHiddenNames((prev) => {
            const newSet = new Set(prev);
            nameIds.forEach((id) => {
              if (isHide) newSet.add(id);
              else newSet.delete(id);
            });
            return newSet;
          });

          // Clear selection
          setSelectedNames(new Set());

          // * Clear caches to ensure hidden names don't appear in tournaments
          clearAllCaches();

          // Refresh data
          fetchNames(activeUser);
        } else {
          const action = isHide ? "hide" : "unhide";
          const processed = result.processed || 0;
          const errorMsg =
            result.error ||
            (processed === 0 ? "No names were processed" : "Unknown error");
          const errorMessage = `❌ Failed to ${action} names${errorMsg ? `: ${errorMsg}` : ""}`;

          devError("[useProfileNameOperations] Operation failed:", {
            result,
            errorMessage,
          });

          showError(errorMessage);
        }
      } catch (error) {
        devError(`Profile - Bulk ${isHide ? "Hide" : "Unhide"} error:`, error);
        const action = isHide ? "hide" : "unhide";
        const errorMessage =
          error instanceof Error
            ? `❌ Failed to ${action} names: ${error.message}`
            : `❌ Failed to ${action} names. Please try again.`;
        showError(errorMessage);
      }
    },
    [
      activeUser,
      canManageActiveUser,
      fetchNames,
      setHiddenNames,
      showError,
      showSuccess,
    ],
  );

  // * Handle bulk hide operation
  const handleBulkHide = useCallback(
    (nameIds) =>
      performBulkOperation(nameIds, hiddenNamesAPI.hideNames, "Hidden", true),
    [performBulkOperation],
  );

  // * Handle bulk unhide operation
  const handleBulkUnhide = useCallback(
    (nameIds) =>
      performBulkOperation(
        nameIds,
        hiddenNamesAPI.unhideNames,
        "Unhidden",
        false,
      ),
    [performBulkOperation],
  );

  return {
    selectedNames,
    setSelectedNames,
    handleToggleVisibility,
    handleDelete,
    handleSelectionChange,
    handleBulkHide,
    handleBulkUnhide,
  };
}
