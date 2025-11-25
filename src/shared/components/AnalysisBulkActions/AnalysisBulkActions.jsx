/**
 * @module AnalysisBulkActions
 * @description Unified bulk actions component for Analysis Mode.
 * Minimal toolbar with intentional actions.
 */

import React from "react";
import PropTypes from "prop-types";
import { AnalysisToolbar, AnalysisButton } from "../AnalysisPanel";

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
 * @param {boolean} props.isAllSelected - Whether all items are selected
 * @param {boolean} props.showActions - Whether to show the actions
 */
export function AnalysisBulkActions({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBulkHide,
  onBulkUnhide,
  isAllSelected,
  showActions = true,
}) {
  if (!showActions) return null;

  return (
    <AnalysisToolbar
      selectedCount={selectedCount}
      actions={
        selectedCount > 0 && (
          <>
            <AnalysisButton
              variant="danger"
              onClick={onBulkHide}
              ariaLabel={`Hide ${selectedCount} selected names`}
            >
              Hide
            </AnalysisButton>
            <AnalysisButton
              variant="primary"
              onClick={onBulkUnhide}
              ariaLabel={`Unhide ${selectedCount} selected names`}
            >
              Unhide
            </AnalysisButton>
          </>
        )
      }
    >
      <div className="analysis-toolbar-group">
        <AnalysisButton
          variant="ghost"
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          ariaLabel={isAllSelected ? "Deselect all names" : "Select all names"}
        >
          {isAllSelected ? "Deselect All" : "Select All"}
        </AnalysisButton>
      </div>
    </AnalysisToolbar>
  );
}

AnalysisBulkActions.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onDeselectAll: PropTypes.func.isRequired,
  onBulkHide: PropTypes.func.isRequired,
  onBulkUnhide: PropTypes.func.isRequired,
  isAllSelected: PropTypes.bool.isRequired,
  showActions: PropTypes.bool,
};

export default AnalysisBulkActions;
