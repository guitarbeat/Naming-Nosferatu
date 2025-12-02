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

  // * Calculate card size based on content for mosaic layout
  // * Creates dramatic size variations for a true mosaic effect
  const calculateCardSize = (nameObj, index) => {
    const hasImage = !!getCatImage(nameObj.id);
    const hasDescription = !!nameObj.description;
    const descriptionLength = nameObj.description?.length || 0;
    const hasMetadata = isAdmin && (nameObj.avg_rating || nameObj.popularity_score);
    const nameLength = nameObj.name?.length || 0;

    // * Create a hash from name ID for consistent but varied sizing
    const nameHash = nameObj.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashMod = Math.abs(nameHash) % 100;
    const hashMod2 = Math.abs(nameHash) % 50; // * Second hash for additional variation

    // * Base row span varies dramatically from 3-10 rows (60-200px) for visual interest
    // * This creates a more organic, less uniform look
    let rowSpan = 3 + (hashMod % 8); // * 3-10 base rows

    // * Cards with images get significantly larger (featured cards)
    if (hasImage) {
      // * Large featured cards: 15-22 rows (300-440px) - very prominent
      rowSpan = 15 + (hashMod % 8);
    } else if (hasDescription) {
      // * Cards with descriptions: scale dramatically based on length
      if (descriptionLength < 20) {
        rowSpan += 1; // * Tiny description: +20px
      } else if (descriptionLength < 40) {
        rowSpan += 3; // * Small description: +60px
      } else if (descriptionLength < 70) {
        rowSpan += 5; // * Medium description: +100px
      } else if (descriptionLength < 100) {
        rowSpan += 7; // * Large description: +140px
      } else {
        rowSpan += 10; // * Very large description: +200px
      }

      // * Add some randomness based on hash for more variation
      rowSpan += hashMod2 % 3;
    } else {
      // * Cards without descriptions get some random variation too
      rowSpan += hashMod2 % 4;
    }

    // * Add rows for metadata (makes cards taller)
    if (hasMetadata) {
      rowSpan += 4 + (hashMod % 3); // * 4-6 extra rows
    }

    // * Longer names get more space
    if (nameLength > 10) {
      rowSpan += 1;
    }
    if (nameLength > 15) {
      rowSpan += 1;
    }
    if (nameLength > 20) {
      rowSpan += 2;
    }

    // * Column span: create more variety (1, 2, or even 3 columns)
    // * More aggressive column spanning for true mosaic effect
    let colSpan = 1;

    // * Featured cards with images: 2-3 columns for dramatic effect
    if (hasImage) {
      // * 40% get 2 columns, 60% get 3 columns for more variety
      colSpan = (hashMod < 40) ? 2 : 3;
    } else if (descriptionLength > 50) {
      // * Medium-long descriptions: 2 columns (more common)
      colSpan = 2;
    } else if (hasMetadata && descriptionLength > 20) {
      // * Cards with metadata and any description: 2 columns
      colSpan = 2;
    } else if (descriptionLength > 30) {
      // * Medium descriptions: 2 columns
      colSpan = 2;
    } else if (descriptionLength > 15 && hashMod < 50) {
      // * Short descriptions: 50% chance of 2 columns
      colSpan = 2;
    } else if (nameLength > 15 && hashMod < 30) {
      // * Long names: 30% chance of 2 columns
      colSpan = 2;
    } else if (hashMod < 25) {
      // * 25% of remaining cards randomly get 2 columns for visual variety
      colSpan = 2;
    }

    // * Ensure minimum sizes but allow more variation
    rowSpan = Math.max(rowSpan, 3);
    rowSpan = Math.min(rowSpan, 25); // * Cap at 25 rows (500px) for very large cards
    colSpan = Math.min(colSpan, 3); // * Cap at 3 columns max

    return { rowSpan, colSpan };
  };

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
      {processedNames.map((nameObj, index) => {
        const { rowSpan, colSpan } = calculateCardSize(nameObj, index);
        const cardImage = getCatImage(nameObj.id);

        return (
          <div
            key={nameObj.id}
            className={styles.cardWrapper}
            style={{
              gridRow: `span ${rowSpan}`,
              gridColumn: colSpan > 1 ? `span ${colSpan}` : 'auto',
            }}
            data-col-span={colSpan}
            data-row-span={rowSpan}
          >
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
