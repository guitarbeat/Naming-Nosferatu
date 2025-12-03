/**
 * @module NameGrid
 * @description Grid of name cards with filtering.
 * Simple: names have is_hidden property. That's it.
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import NameCard from "../NameCard/NameCard";
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";
import { applyNameFilters, isNameHidden } from "../../utils/nameFilterUtils";
import styles from "./NameGrid.module.css";

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
}) {
  const selectedSet = useMemo(() => {
    if (selectedNames instanceof Set) return selectedNames;
    if (Array.isArray(selectedNames)) {
      return new Set(selectedNames.map(item =>
        typeof item === "object" ? item.id : item
      ));
    }
    return new Set();
  }, [selectedNames]);

  const processedNames = useMemo(() => {
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

    if (showSelectedOnly && selectedSet.size > 0) {
      result = result.filter(name => selectedSet.has(name.id));
    }

    return result;
  }, [names, filters, isAdmin, showSelectedOnly, selectedSet]);

  const getCatImage = (nameId) => {
    if (!showCatPictures || !imageList.length) return undefined;
    const hash = nameId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return imageList[Math.abs(hash) % imageList.length];
  };

  // Removed complex calculateCardSize - cards now auto-size to content

  if (isLoading) {
    return (
      <div className={className || styles.grid}>
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
          {showSelectedOnly ? "No names selected." : "Try adjusting your filters."}
        </p>
      </div>
    );
  }

  return (
    <div className={className || styles.grid}>
      {processedNames.map((nameObj) => {
        const cardImage = getCatImage(nameObj.id);

        return (
          <div key={nameObj.id} className={styles.cardWrapper}>
            <NameCard
              name={nameObj.name}
              description={nameObj.description}
              isSelected={selectedSet.has(nameObj.id)}
              onClick={() => onToggleName?.(nameObj)}
              image={cardImage}
              metadata={isAdmin ? {
                rating: nameObj.avg_rating || 1500,
                popularity: nameObj.popularity_score,
              } : undefined}
              className={isNameHidden(nameObj) ? styles.hiddenCard : ""}
              isAdmin={isAdmin}
              isHidden={isNameHidden(nameObj)}
              onToggleVisibility={isAdmin ? () => onToggleVisibility?.(nameObj.id) : undefined}
              onDelete={isAdmin ? () => onDelete?.(nameObj) : undefined}
              showAdminControls={isAdmin}
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
};
