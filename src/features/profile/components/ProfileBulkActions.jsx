/**
 * @module ProfileBulkActions
 * @description Bulk action controls for selected names in the profile view.
 * Uses shared Button component for consistency.
 */

import React from "react";
import PropTypes from "prop-types";
import { Button } from "../../../shared/components";
import styles from "./ProfileBulkActions.module.css";

export function ProfileBulkActions({
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
    <div className={styles.bulkActionsContainer}>
      {/* Selection Info */}
      {selectedCount > 0 && (
        <div className={styles.selectionInfo}>
          <span className={styles.count}>{selectedCount}</span>
          <span className={styles.label}>
            {selectedCount === 1 ? "name" : "names"} selected
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
          variant="secondary"
          size="small"
          aria-label={isAllSelected ? "Deselect all names" : "Select all names"}
        >
          {isAllSelected ? "Deselect All" : "Select All"}
        </Button>

        {selectedCount > 0 && (
          <>
            <Button
              onClick={onBulkHide}
              variant="danger"
              size="small"
              aria-label={`Hide ${selectedCount} selected ${selectedCount === 1 ? "name" : "names"}`}
            >
              Hide {selectedCount > 1 && `(${selectedCount})`}
            </Button>
            <Button
              onClick={onBulkUnhide}
              variant="primary"
              size="small"
              aria-label={`Unhide ${selectedCount} selected ${selectedCount === 1 ? "name" : "names"}`}
            >
              Unhide {selectedCount > 1 && `(${selectedCount})`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

ProfileBulkActions.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onDeselectAll: PropTypes.func.isRequired,
  onBulkHide: PropTypes.func.isRequired,
  onBulkUnhide: PropTypes.func.isRequired,
  isAllSelected: PropTypes.bool.isRequired,
  showActions: PropTypes.bool,
};
