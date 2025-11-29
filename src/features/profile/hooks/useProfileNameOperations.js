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
 * @param {Function} showToast - Toast notification function
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
  showToast,
) {
  const [selectedNames, setSelectedNames] = useState(new Set());

  // * Handle name visibility toggle
  const handleToggleVisibility = useCallback(
    async (nameId) => {
      try {
        const currentlyHidden = hiddenNames.has(nameId);

        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Supabase not configured, cannot toggle visibility");
          }
          showError("Database not available");
          return;
        }

        if (!canManageActiveUser) {
          showError("Only admins can change visibility");
          showToast("Only admins can hide or unhide names", "error");
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
        if (process.env.NODE_ENV === "development") {
          console.log(
            `🔍 Toggled visibility for name ${nameId}: ${currentlyHidden ? "unhidden" : "hidden"} for user: ${activeUser}`,
          );
        }

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
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Profile - Toggle Visibility error:", errorMessage);
        showToast(`Failed to toggle name visibility: ${errorMessage}`, "error");
        showError("Failed to update visibility");
      }
    },
    [
      hiddenNames,
      activeUser,
      showSuccess,
      showError,
      showToast,
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
          if (process.env.NODE_ENV === "development") {
            console.warn("Supabase not configured, cannot delete name");
          }
          showError("Database not available");
          return;
        }

        if (!canManageActiveUser) {
          showError("Only admins can delete names");
          showToast("Only admins can delete names", "error");
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
        console.error("Profile - Delete Name error:", errorMessage);
        showToast(`Failed to delete name: ${errorMessage}`, "error");
        showError("Failed to delete name");
      }
    },
    [
      fetchNames,
      fetchSelectionStats,
      showError,
      showToast,
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
      try {
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Supabase not configured, cannot perform bulk operation",
            );
          }
          showError("Database not available");
          return;
        }

        if (!canManageActiveUser) {
          const action = isHide ? "hide" : "unhide";
          showError(`Only admins can ${action} names`);
          showToast(`Only admins can ${action} names`, "error");
          return;
        }

        const result = await operation(activeUser, nameIds);

        if (result.success) {
          showSuccess(
            `${successMessage} ${result.processed} name${result.processed !== 1 ? "s" : ""}`,
          );

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

          // Refresh data
          fetchNames(activeUser);
        } else {
          showError(`Failed to ${isHide ? "hide" : "unhide"} names`);
        }
      } catch (error) {
        console.error(
          `Profile - Bulk ${isHide ? "Hide" : "Unhide"} error:`,
          error,
        );
        showToast(`Failed to ${isHide ? "hide" : "unhide"} names`, "error");
        showError(`Failed to ${isHide ? "hide" : "unhide"} names`);
      }
    },
    [
      activeUser,
      canManageActiveUser,
      fetchNames,
      setHiddenNames,
      showError,
      showSuccess,
      showToast,
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
