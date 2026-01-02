import React, { useMemo, useCallback } from "react";
import { useNameManagementContextSafe } from "../../../shared/components/NameManagementView/NameManagementView";
import { AnalysisBulkActions } from "../../../shared/components/AnalysisPanel/components/AnalysisBulkActions";
import { useProfile } from "../../profile/hooks/useProfile";
import { useNameManagementCallbacks } from "../hooks/useTournamentSetupHooks";
import {
  extractNameIds,
  isNameHidden,
  selectedNamesToSet,
  exportTournamentResultsToCSV,
  devLog,
  devWarn,
  devError,
  NameId,
} from "../../../shared/utils/coreUtils";

interface AnalysisBulkActionsWrapperProps {
  activeUser: string | null;
  canManageActiveUser: boolean;
  isAdmin: boolean;
  fetchSelectionStats?: () => void;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  showToast?: (msg: string) => void;
  onExport?: () => void;
}

export function AnalysisBulkActionsWrapper({
  activeUser,
  canManageActiveUser,
  isAdmin,
  showSuccess,
  showError,
  showToast,
}: AnalysisBulkActionsWrapperProps) {
  const context = useNameManagementContextSafe();

  const selectedCount = context?.selectedCount ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedNamesValue = context?.selectedNames as any;
  // * Keep both Set format for selection logic and original array for bulk operations
  const selectedNamesSet = useMemo(
    () => selectedNamesToSet(selectedNamesValue),
    [selectedNamesValue],
  );

  // * Extract name IDs from selectedNames, handling different formats
  const selectedNamesArray = useMemo(
    () => extractNameIds(selectedNamesValue),
    [selectedNamesValue],
  );

  const { setAllNames, fetchNames } =
    useNameManagementCallbacks(context);

  const { handleBulkHide, handleBulkUnhide } = useProfile(activeUser, {
    showSuccess,
    showError,
    fetchNames,
    setAllNames,
  });

  const contextNames = context?.names;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contextFilterStatus = (context as any)?.filterStatus;

  const filteredAndSortedNames = useMemo(() => {
    if (!contextNames || contextNames.length === 0) return [];
    let filtered = [...contextNames];

    // Use shared isNameHidden utility for consistent visibility check
    if (contextFilterStatus === "visible") {
      filtered = filtered.filter((name) => !isNameHidden(name));
    } else if (contextFilterStatus === "hidden") {
      filtered = filtered.filter((name) => isNameHidden(name));
    }
    // * "all" shows everything (no filtering)

    return filtered;
  }, [contextNames, contextFilterStatus]);

  const allVisibleSelected =
    filteredAndSortedNames.length > 0 &&
    filteredAndSortedNames.every((name) => selectedNamesSet.has(name.id));

  const handleSelectAll = useCallback(() => {
    const visibleNameIds = filteredAndSortedNames.map((name) => name.id);
    if (visibleNameIds.length === 0) {
      return;
    }
    const shouldSelect = !allVisibleSelected;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((context as any)?.toggleNamesByIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context as any).toggleNamesByIds(visibleNameIds, shouldSelect);
      return;
    }
    visibleNameIds.forEach((id) => {
      context?.toggleNameById?.(id, shouldSelect);
    });
  }, [allVisibleSelected, filteredAndSortedNames, context]);

  const handleExport = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportTournamentResultsToCSV(filteredAndSortedNames as any, "naming_nosferatu_export");
  }, [filteredAndSortedNames]);

  if (!context || !canManageActiveUser || filteredAndSortedNames.length === 0) {
    return null;
  }

  return (
    <AnalysisBulkActions
      selectedCount={selectedCount}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleSelectAll}
      onBulkHide={() => {
        devLog("[TournamentSetup] onBulkHide called", {
          selectedCount,
          selectedNamesArrayLength: selectedNamesArray.length,
          selectedNamesArray,
          contextSelectedNames: context.selectedNames,
        });

        if (selectedNamesArray.length === 0) {
          devWarn(
            "[TournamentSetup] No names in selectedNamesArray despite selectedCount:",
            selectedCount,
          );
          showError("No names selected");
          return;
        }

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handleBulkHide(selectedNamesArray as any[]);
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          devError("[TournamentSetup] Error calling handleBulkHide:", error);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          showError(`Failed to hide names: ${(error as any).message || "Unknown error"}`);
        }
      }}
      onBulkUnhide={() => {
        if (selectedNamesArray.length === 0) {
          showError("No names selected");
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleBulkUnhide(selectedNamesArray as any[]);
      }}
      onExport={handleExport}
      isAllSelected={allVisibleSelected}
      showActions={true}
      isAdmin={isAdmin}
      totalCount={filteredAndSortedNames.length}
    />
  );
}
