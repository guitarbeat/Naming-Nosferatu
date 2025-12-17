/**
 * @module NameGrid
 * @description Grid of name cards with filtering.
 * Simple: names have is_hidden property. That's it.
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
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
  // * Responsive breakpoints for masonry layout
  const columnsCountBreakPoints = {
    350: 1,
    480: 2,
    600: 2,
    768: 3,
    1024: 4,
    1440: 5,
    1920: 6,
  };

  // * Responsive gutter sizes for different breakpoints
  const gutterBreakpoints = {
    350: "8px",
    480: "10px",
    600: "12px",
    768: "12px",
    1024: "12px",
    1440: "16px",
    1920: "16px",
  };

  const selectedSet = useMemo(() => {
    if (selectedNames instanceof Set) return selectedNames;
    if (Array.isArray(selectedNames)) {
      return new Set(
        selectedNames.map((item) =>
          typeof item === "object" ? item.id : item,
        ),
      );
    }
    return new Set();
  }, [selectedNames]);

  const processedNames = useMemo(() => {
    // * Map filterStatus to visibility
    const visibility =
      filters.filterStatus === "hidden"
        ? "hidden"
        : filters.filterStatus === "all"
          ? "all"
          : filters.filterStatus === "visible"
            ? "visible"
            : "visible"; // * Default to visible

    let result = applyNameFilters(names, {
      searchTerm: filters.searchTerm,
      category: filters.category,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder || "desc",
      visibility,
      isAdmin,
    });

    if (showSelectedOnly && selectedSet.size > 0) {
      result = result.filter((name) => selectedSet.has(name.id));
    }

    return result;
  }, [names, filters, isAdmin, showSelectedOnly, selectedSet]);

  const getCatImage = (nameId) => {
    if (!showCatPictures || !imageList.length) return undefined;
    const hash = nameId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return imageList[Math.abs(hash) % imageList.length];
  };

  if (isLoading) {
    return (
      <div className={`${styles.gridContainer} ${className}`}>
        <ResponsiveMasonry
          columnsCountBreakPoints={columnsCountBreakPoints}
          gutterBreakpoints={gutterBreakpoints}
          className={styles.masonryGrid}
        >
          <Masonry className={styles.masonry}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.cardWrapper}>
                <SkeletonLoader height={120} />
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </div>
    );
  }

  if (processedNames.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No names found</h3>
        <p className={styles.emptyMessage}>
          {showSelectedOnly
            ? "No names selected."
            : "Try adjusting your filters."}
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.gridContainer} ${className}`}>
      <ResponsiveMasonry
        columnsCountBreakPoints={columnsCountBreakPoints}
        gutterBreakpoints={gutterBreakpoints}
        className={styles.masonryGrid}
      >
        <Masonry className={styles.masonry}>
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
                  metadata={
                    isAdmin
                      ? {
                          rating: nameObj.avg_rating || 1500,
                          popularity: nameObj.popularity_score,
                        }
                      : undefined
                  }
                  className={isNameHidden(nameObj) ? styles.hiddenCard : ""}
                  isAdmin={isAdmin}
                  isHidden={isNameHidden(nameObj)}
                  onToggleVisibility={
                    isAdmin ? () => onToggleVisibility?.(nameObj.id) : undefined
                  }
                  onDelete={isAdmin ? () => onDelete?.(nameObj) : undefined}
                  showAdminControls={isAdmin}
                />
              </div>
            );
          })}
        </Masonry>
      </ResponsiveMasonry>
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
    searchTerm: PropTypes.string,
    category: PropTypes.string,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.oneOf(["asc", "desc"]),
    filterStatus: PropTypes.oneOf(["visible", "hidden", "all"]),
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
