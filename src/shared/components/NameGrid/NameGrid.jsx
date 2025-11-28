/**
 * @module NameGrid
 * @description Unified component for displaying a grid of name cards.
 * Used by both Tournament Setup and Profile views.
 * Supports filtering, sorting, selection, and different display modes.
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import NameCard from "../NameCard/NameCard";
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";
import { filterAndSortNames } from "../../../features/tournament/utils";
import styles from "./NameGrid.module.css";

/**
 * Unified name grid component
 * @param {Object} props - Component props
 * @param {Array} props.names - Array of name objects to display
 * @param {Array} props.selectedNames - Array of selected name IDs or objects
 * @param {Function} props.onToggleName - Handler for name selection
 * @param {Object} props.filters - Filter configuration
 * @param {string} props.filters.category - Selected category filter
 * @param {string} props.filters.searchTerm - Search term
 * @param {string} props.filters.sortBy - Sort method
 * @param {string} props.mode - Display mode: 'tournament' or 'profile'
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isAdmin - Admin status
 * @param {boolean} props.showSelectedOnly - Only show selected names
 * @param {boolean} props.showCatPictures - Show cat images on cards
 * @param {Array} props.imageList - List of cat images
 * @param {Set} props.hiddenIds - Set of hidden name IDs (profile mode)
 * @param {Function} props.onToggleVisibility - Handler for visibility toggle (profile mode)
 * @param {Function} props.onDelete - Handler for name deletion (profile mode)
 * @param {boolean} props.showAdminControls - Show admin controls on cards
 */
export function NameGrid({
  names = [],
  selectedNames = [],
  onToggleName,
  filters = {},
  mode = "tournament",
  isLoading = false,
  isAdmin = false,
  showSelectedOnly = false,
  showCatPictures = false,
  imageList = [],
  hiddenIds = new Set(),
  onToggleVisibility,
  onDelete,
  showAdminControls = false,
  className = "",
}) {
  // Convert selectedNames to a Set for efficient lookup
  const selectedSet = useMemo(() => {
    if (Array.isArray(selectedNames)) {
      return new Set(
        selectedNames.map((item) =>
          typeof item === "object" ? item.id : item,
        ),
      );
    }
    return selectedNames instanceof Set ? selectedNames : new Set();
  }, [selectedNames]);

  // Filter and sort names
  const processedNames = useMemo(() => {
    let filtered = filterAndSortNames(names, filters);

    // Apply show selected only filter
    if (showSelectedOnly && selectedSet.size > 0) {
      filtered = filtered.filter((name) => selectedSet.has(name.id));
    }

    // In profile mode, filter out hidden names by default (unless explicitly showing them)
    if (mode === "profile" && !filters.showHidden) {
      filtered = filtered.filter((name) => !hiddenIds.has(name.id));
    }

    return filtered;
  }, [names, filters, showSelectedOnly, selectedSet, mode, hiddenIds]);

  // Get random cat image for a name
  const getRandomCatImage = (nameId) => {
    if (!showCatPictures || imageList.length === 0) return undefined;
    const index = Math.abs(
      nameId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
    );
    return imageList[index % imageList.length];
  };

  // * Admin features (hide/delete) should only be active when showAdminControls is true
  // * This ensures they're only available in profile mode or analysis mode

  // * Use custom className if provided, otherwise use default grid styles
  const gridClassName = className || styles.grid;

  // Loading state
  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonLoader key={index} height={120} />
        ))}
      </div>
    );
  }

  // Empty state
  if (processedNames.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No names found</h3>
        <p className={styles.emptyMessage}>
          {showSelectedOnly
            ? "No names selected yet. Select some names to see them here."
            : filters.searchTerm || filters.category
              ? "Try adjusting your filters to see more names."
              : "No names available."}
        </p>
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {processedNames.map((nameObj) => {
        const isSelected = selectedSet.has(nameObj.id);
        // * Only check hidden status if admin controls are enabled
        const isHidden =
          showAdminControls &&
          hiddenIds instanceof Set &&
          hiddenIds.has(nameObj.id);

        return (
          <div key={nameObj.id} className={styles.cardWrapper}>
            {/* Hidden badge - only show in profile mode or analysis mode */}
            {/* Hidden badge removed in favor of NameCard's internal styling */}
            <NameCard
              name={nameObj.name}
              description={nameObj.description}
              isSelected={isSelected}
              onClick={
                mode === "tournament"
                  ? () => onToggleName?.(nameObj)
                  : undefined
              }
              image={
                showCatPictures ? getRandomCatImage(nameObj.id) : undefined
              }
              metadata={
                mode === "profile"
                  ? {
                      rating: nameObj.user_rating || nameObj.avg_rating || 1500,
                      popularity: nameObj.popularity_score,
                      tournaments: nameObj.total_tournaments,
                      categories: nameObj.categories,
                      winRate:
                        nameObj.user_wins && nameObj.user_losses
                          ? Math.round(
                              (nameObj.user_wins /
                                (nameObj.user_wins + nameObj.user_losses)) *
                                100,
                            )
                          : 0,
                      totalMatches:
                        (nameObj.user_wins || 0) + (nameObj.user_losses || 0),
                    }
                  : isAdmin
                    ? {
                        rating: nameObj.avg_rating || 1500,
                        popularity: nameObj.popularity_score,
                      }
                    : undefined
              }
              className={
                mode === "profile" && isHidden ? styles.hiddenCard : ""
              }
              // * Admin controls - only show when showAdminControls is true (analysis mode or profile mode)
              // * This ensures hide/delete features are only available when explicitly enabled
              isAdmin={showAdminControls && isAdmin}
              isHidden={showAdminControls ? isHidden : false}
              onToggleVisibility={
                showAdminControls && isAdmin
                  ? () => onToggleVisibility?.(nameObj.id)
                  : undefined
              }
              onDelete={
                showAdminControls && isAdmin
                  ? () => onDelete?.(nameObj)
                  : undefined
              }
              onSelectionChange={
                showAdminControls && isAdmin
                  ? (selected) => onToggleName?.(nameObj.id, selected)
                  : undefined
              }
              showAdminControls={showAdminControls && isAdmin}
            />
          </div>
        );
      })}
    </div>
  );
}

NameGrid.propTypes = {
  names: PropTypes.array.isRequired,
  selectedNames: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.instanceOf(Set),
  ]),
  onToggleName: PropTypes.func,
  filters: PropTypes.shape({
    category: PropTypes.string,
    searchTerm: PropTypes.string,
    sortBy: PropTypes.string,
    showHidden: PropTypes.bool,
  }),
  mode: PropTypes.oneOf(["tournament", "profile"]),
  isLoading: PropTypes.bool,
  isAdmin: PropTypes.bool,
  showSelectedOnly: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageList: PropTypes.array,
  hiddenIds: PropTypes.instanceOf(Set),
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
  showAdminControls: PropTypes.bool,
  className: PropTypes.string,
};
