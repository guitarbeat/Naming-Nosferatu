/**
 * @module AnalysisBulkActions
 * @description Unified bulk actions component for Analysis Mode.
 * Minimal toolbar with intentional actions and CSV export.
 */

import { useCallback } from "react";
import PropTypes from "prop-types";
import { AnalysisToolbar, AnalysisButton } from "./AnalysisComponents";
import { exportNamesToCSV } from "../../../utils/coreUtils";
import { devError } from "../../../utils/coreUtils";

/**
 * Analysis Bulk Actions Component
 * Streamlined action bar for batch operations
 *
 * @param {Object} props
 * @param {number} props.selectedCount - Number of selected items
 * @param {Function} props.onSelectAll - Select all handler
 * @param {Function} props.onDeselectAll - Deselect all handler
 * @param {Function} props.onBulkHide - Bulk hide handler
 * @param {Function} props.onBulkUnhide - Bulk unhide handler
 * @param {Function} props.onExport - Custom export handler (optional)
 * @param {Array} props.names - Names data for built-in export
 * @param {Array} props.selectedNames - Selected names for export
 * @param {boolean} props.isAllSelected - Whether all items are selected
 * @param {boolean} props.showActions - Whether to show the actions
 * @param {boolean} props.isAdmin - Whether user is admin (shows hide/unhide)
 */
// ts-prune-ignore-next (used in AnalysisPanel)
export function AnalysisBulkActions({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBulkHide,
  onBulkUnhide,
  onExport,
  names,
  selectedNames,
  isAllSelected,
  showActions = true,
  isAdmin = false,
  totalCount = 0,
}: {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkHide?: () => void;
  onBulkUnhide?: () => void;
  onExport?: () => void;
  names?: Array<Record<string, unknown>>;
  selectedNames?: Array<Record<string, unknown>>;
  isAllSelected: boolean;
  showActions?: boolean;
  isAdmin?: boolean;
  totalCount?: number;
}) {
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
      return;
    }

    const dataToExport =
      (selectedNames?.length ?? 0) > 0 ? selectedNames : names || [];
    const fileName = (selectedNames?.length ?? 0) > 0 ? "selected-names" : "all-names";
    exportNamesToCSV(dataToExport as Array<{ name: string; [key: string]: unknown }>, fileName);
  }, [onExport, names, selectedNames]);

  const handleBulkHide = useCallback(() => {
    if (selectedCount > 5) {
      const confirmed = window.confirm(
        `Are you sure you want to hide ${selectedCount} names? This will remove them from tournaments.`,
      );
      if (!confirmed) return;
    }

    if (!onBulkHide) {
      devError("[AnalysisBulkActions] onBulkHide handler is not provided");
      return;
    }

    try {
      onBulkHide();
    } catch (error) {
      devError("[AnalysisBulkActions] Error in onBulkHide handler:", error);
    }
  }, [selectedCount, onBulkHide]);

  if (!showActions) return null;

  const hasExportData =
    onExport || (names?.length ?? 0) > 0 || (selectedNames?.length ?? 0) > 0;
  const effectiveTotal = totalCount || names?.length || 0;

  return (
    <AnalysisToolbar
      selectedCount={selectedCount}
      actions={
        <>
          {selectedCount > 0 && isAdmin && (
            <>
              <AnalysisButton
                variant="danger"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBulkHide();
                }}
                ariaLabel={`Hide ${selectedCount} selected names`}
                title="Hide selected names from tournaments"
                disabled={selectedCount === 0}
              >
                <span aria-hidden="true">🙈</span> Hide
              </AnalysisButton>
              <AnalysisButton
                variant="primary"
                onClick={onBulkUnhide}
                ariaLabel={`Unhide ${selectedCount} selected names`}
                title="Make selected names visible in tournaments"
              >
                <span aria-hidden="true">👁️</span> Unhide
              </AnalysisButton>
            </>
          )}
          {hasExportData && (
            <>
              {selectedCount > 0 && isAdmin && hasExportData && (
                <div className="analysis-toolbar-divider" />
              )}
              <AnalysisButton
                variant="default"
                onClick={handleExport}
                ariaLabel={
                  selectedCount > 0
                    ? `Export ${selectedCount} selected names to CSV`
                    : "Export all visible names to CSV"
                }
                title="Download as CSV file"
              >
                <span aria-hidden="true">📥</span> Export{" "}
                {selectedCount > 0 ? "" : "All"}
              </AnalysisButton>
            </>
          )}
        </>
      }
    >
      <div className="analysis-toolbar-group">
        <AnalysisButton
          variant="ghost"
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          ariaLabel={isAllSelected ? "Deselect all names" : "Select all names"}
        >
          <span aria-hidden="true">{isAllSelected ? "☐" : "☑"}</span>{" "}
          {isAllSelected ? "Deselect All" : "Select All"}
          {effectiveTotal > 0 && !isAllSelected && (
            <span className="analysis-btn-count">({effectiveTotal})</span>
          )}
        </AnalysisButton>
      </div>
    </AnalysisToolbar>
  );
}

AnalysisBulkActions.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onDeselectAll: PropTypes.func.isRequired,
  onBulkHide: PropTypes.func,
  onBulkUnhide: PropTypes.func,
  onExport: PropTypes.func,
  names: PropTypes.array,
  selectedNames: PropTypes.array,
  isAllSelected: PropTypes.bool.isRequired,
  showActions: PropTypes.bool,
  isAdmin: PropTypes.bool,
  totalCount: PropTypes.number,
};
