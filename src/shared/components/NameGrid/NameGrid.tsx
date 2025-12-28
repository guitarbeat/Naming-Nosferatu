/**
 * @module NameGrid
 * @description Grid of name cards with filtering.
 * Simple: names have is_hidden property. That's it.
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import Card from "../Card/Card";
import CardName from "../Card/components/CardName";
import Loading from "../Loading/Loading";
import {
  applyNameFilters,
  isNameHidden,
  mapFilterStatusToVisibility,
  selectedNamesToSet,
} from "../../utils/nameUtils";
import styles from "./NameGrid.module.css";

interface NameItem {
  id: string | number;
  name: string;
  description?: string;
  avg_rating?: number;
  popularity_score?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface NameGridProps {
  names: NameItem[];
  selectedNames?: NameItem[] | Set<string | number>;
  onToggleName?: (name: NameItem) => void;
  filters?: {
    searchTerm?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filterStatus?: "visible" | "hidden" | "all";
  };
  isAdmin?: boolean;
  showSelectedOnly?: boolean;
  showCatPictures?: boolean;
  imageList?: string[];
  onToggleVisibility?: (id: string | number) => void;
  onDelete?: (name: NameItem) => void;
  isLoading?: boolean;
  className?: string;
}

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
}: NameGridProps) {
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

  const selectedSet = useMemo(
    () => selectedNamesToSet(selectedNames),
    [selectedNames],
  );

  const processedNames = useMemo(() => {
    const visibility = mapFilterStatusToVisibility(filters.filterStatus || "visible");

    let result = applyNameFilters(names, {
      searchTerm: filters.searchTerm,
      category: filters.category,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder || "desc",
      visibility,
      isAdmin,
    });

    if (showSelectedOnly && selectedSet.size > 0) {
      result = result.filter((name) => {
        const nameId = name.id as string | number;
        return selectedSet.has(nameId);
      });
    }

    return result;
  }, [names, filters, isAdmin, showSelectedOnly, selectedSet]);

  const getCatImage = (nameId: string | number) => {
    if (!showCatPictures || !imageList.length) return undefined;
    const hash = String(nameId)
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
                <Loading variant="skeleton" height={120} />
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
            const nameId = nameObj.id as string | number;
            const cardImage = getCatImage(nameId);
            const nameItem: NameItem = nameObj as NameItem;

            return (
              <div key={String(nameId)} className={styles.cardWrapper}>
                <CardName
                  name={nameObj.name || ""}
                  description={nameObj.description}
                  isSelected={selectedSet.has(nameId)}
                  onClick={() => onToggleName?.(nameItem)}
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
                  _onToggleVisibility={
                    isAdmin ? () => onToggleVisibility?.(nameId) : undefined
                  }
                  _onDelete={isAdmin ? () => onDelete?.(nameItem) : undefined}
                  onSelectionChange={undefined}
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
