/**
 * @module NameGrid
 * @description Unified component for displaying a grid of name cards.
 * Simplified: names are either visible or hidden. That's it.
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import NameCard from "../NameCard/NameCard";
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";
import { applyNameFilters, isNameHidden } from "../../utils/nameFilterUtils";
import styles from "./NameGrid.module.css";

/**
 * Unified name grid component
 * @param {Object} props - Component props
 * @param {Array} props.names - Array of name objects
 * @param {Array|Set} props.selectedNames - Selected name IDs
 * @param {Function} props.onToggleName - Selection handler
 * @param {Object} props.filters - Filter config (searchTerm, category, sortBy, visibility)
 * @param {boolean} props.isAdmin - Admin status (can see/manage hidden names)
 * @param {boolean} props.showSelectedOnly - Only show selected names
 * @param {boolean} props.showCatPictures - Show cat images
 * @param {Array} props.imageList - Cat images
 * @param {Function} props.onToggleVisibility - Hide/unhide handler (admin only)
 * @param {Function} props.onDelete - Delete handler (admin only)
 */
export function NameGrid({
  names = [],
  selectedNames = [],
  onToggleName,
  filters = {},
  isAdmin = false,
  showSelectedOnly = false,
  showCatPictures = false,
  imageList = [],
  onToggleVisibility,
  onDelete,
  isLoading = false,
  className = "",
  // Backward compatibility props
  hiddenIds,        // eslint-disable-line no-unused-vars -- visibility now from name.is_hidden
  showAdminControls, // If provided, use this; otherwise fall back to isAdmin
  mode,             // eslint-disable-line no-unused-vars -- no longer needed
}) {
  // Use showAdminControls if explicitly provided, otherwise use isAdmin
  const shouldShowAdminControls = showAdminControls !== undefined ? showAdminControls : isAdmin;
  // Convert selectedNames to Set for O(1) lookup
  const selectedSet = useMemo(() => {
    if (selectedNames instanceof Set) return selectedNames;
    if (Array.isArray(selectedNames)) {
      return new Set(selectedNames.map(item => 
        typeof item === "object" ? item.id : item
      ));
    }
    return new Set();
  }, [selectedNames]);

  // Apply all filters using simplified utility
  const processedNames = useMemo(() => {
    // Map filterStatus to visibility for backward compatibility
    const visibility = filters.filterStatus === "hidden" ? "hidden" 
      : filters.filterStatus === "all" ? "all" 
      : "visible";

    let result = applyNameFilters(names, {
      searchTerm: filters.searchTerm,
      category: filters.category,
      sortBy: filters.sortBy,
      visibility,
      isAdmin,
    });

    // Apply "show selected only" filter
    if (showSelectedOnly && selectedSet.size > 0) {
      result = result.filter(name => selectedSet.has(name.id));
    }

    return result;
  }, [names, filters, isAdmin, showSelectedOnly, selectedSet]);

  // Get consistent cat image for a name
  const getCatImage = (nameId) => {
    if (!showCatPictures || !imageList.length) return undefined;
    const hash = nameId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return imageList[Math.abs(hash) % imageList.length];
  };

  const gridClassName = className || styles.grid;

  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} height={120} />
        ))}
      </div>
    );
  }

  if (processedNames.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No names found</h3>
        <p className={styles.emptyMessage}>
          {showSelectedOnly
            ? "No names selected yet."
            : filters.searchTerm || filters.category
              ? "Try adjusting your filters."
              : "No names available."}
        </p>
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {processedNames.map((nameObj) => {
        const isSelected = selectedSet.has(nameObj.id);
        const hidden = isNameHidden(nameObj);

        return (
          <div key={nameObj.id} className={styles.cardWrapper}>
            <NameCard
              name={nameObj.name}
              description={nameObj.description}
              isSelected={isSelected}
              onClick={() => onToggleName?.(nameObj)}
              image={getCatImage(nameObj.id)}
              metadata={shouldShowAdminControls ? {
                rating: nameObj.avg_rating || 1500,
                popularity: nameObj.popularity_score,
              } : undefined}
              className={hidden ? styles.hiddenCard : ""}
              isAdmin={shouldShowAdminControls}
              isHidden={hidden}
              onToggleVisibility={shouldShowAdminControls ? () => onToggleVisibility?.(nameObj.id) : undefined}
              onDelete={shouldShowAdminControls ? () => onDelete?.(nameObj) : undefined}
              showAdminControls={shouldShowAdminControls}
            />
          </div>
        );
      })}
    </div>
  );
}

NameGrid.propTypes = {
  names: PropTypes.array.isRequired,
  selectedNames: PropTypes.oneOfType([PropTypes.array, PropTypes.instanceOf(Set)]),
  onToggleName: PropTypes.func,
  filters: PropTypes.shape({
    searchTerm: PropTypes.string,
    category: PropTypes.string,
    sortBy: PropTypes.string,
    filterStatus: PropTypes.oneOf(["active", "hidden", "all"]),
  }),
  isAdmin: PropTypes.bool,
  showSelectedOnly: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageList: PropTypes.array,
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  // Backward compatibility (deprecated)
  hiddenIds: PropTypes.instanceOf(Set),
  showAdminControls: PropTypes.bool,
  mode: PropTypes.string,
};
