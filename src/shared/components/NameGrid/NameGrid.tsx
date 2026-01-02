/**
 * @module NameGrid
 * @description Virtualized Grid of name cards.
 * Optimized for performance with large datasets using react-window.
 */

import React, { useMemo, CSSProperties } from "react";
import PropTypes from "prop-types";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import CardName from "../Card/components/CardName";
import Loading from "../Loading/Loading";
import {
  applyNameFilters,
  isNameHidden,
  mapFilterStatusToVisibility,
  selectedNamesToSet,
} from "../../utils/coreUtils";
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

interface ItemData {
  items: NameItem[];
  columnCount: number;
  selectedSet: Set<string | number>;
  onToggleName?: (name: NameItem) => void;
  isAdmin: boolean;
  showCatPictures: boolean;
  imageList: string[];
  onToggleVisibility?: (id: string | number) => void;
  onDelete?: (name: NameItem) => void;
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

  // * Fixed dimensions for grid items
  // * Adjusted to accommodate CardName content while maintaining grid consistency
  const ROW_HEIGHT = 280; 
  const MIN_COLUMN_WIDTH = 260;
  const GUTTER_SIZE = 16;

  const Cell = ({ columnIndex, rowIndex, style, data }: GridChildComponentProps<ItemData>) => {
    const {
      items,
      columnCount,
      selectedSet,
      onToggleName,
      isAdmin,
      showCatPictures,
      imageList,
      onToggleVisibility,
      onDelete,
    } = data;

    const index = rowIndex * columnCount + columnIndex;

    // * Handle cases where the last row isn't full
    if (index >= items.length) {
      return null;
    }

    const nameObj = items[index];
    const nameId = nameObj.id as string | number;
    
    // * Deterministic image selection
    const cardImage = useMemo(() => {
        if (!showCatPictures || !imageList.length) return undefined;
        const hash = String(nameId)
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return imageList[Math.abs(hash) % imageList.length];
    }, [nameId, showCatPictures, imageList]);


    const nameItem: NameItem = nameObj as NameItem;
    const isHidden = isNameHidden(nameObj);

    // * Adjust style to account for gutter
    const itemStyle: CSSProperties = {
      ...style,
      left: Number(style.left) + GUTTER_SIZE,
      top: Number(style.top) + GUTTER_SIZE,
      width: Number(style.width) - GUTTER_SIZE,
      height: Number(style.height) - GUTTER_SIZE,
    };

    return (
      <div style={itemStyle}>
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
          className={isHidden ? styles.hiddenCard : ""}
          isAdmin={isAdmin}
          isHidden={isHidden}
          _onToggleVisibility={
            isAdmin ? () => onToggleVisibility?.(nameId) : undefined
          }
          _onDelete={isAdmin ? () => onDelete?.(nameItem) : undefined}
          onSelectionChange={undefined}
          size="medium" // * Enforce medium size for virtualization consistency
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`${styles.gridContainer} ${className}`}>
         <div className={styles.loadingContainer}>
           <Loading variant="spinner" text="Loading names..." />
         </div>
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
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
            // * Calculate columns based on available width and minimum width
            // * Ensure at least 1 column
            const effectiveWidth = width - GUTTER_SIZE; // Subtract outer gutter
            const columnCount = Math.max(1, Math.floor(effectiveWidth / MIN_COLUMN_WIDTH));
            const columnWidth = effectiveWidth / columnCount;
            const rowCount = Math.ceil(processedNames.length / columnCount);

            return (
                <Grid
                    columnCount={columnCount}
                    columnWidth={columnWidth}
                    height={height}
                    rowCount={rowCount}
                    rowHeight={ROW_HEIGHT}
                    width={width}
                    itemData={{
                        items: processedNames,
                        columnCount,
                        selectedSet,
                        onToggleName,
                        isAdmin,
                        showCatPictures,
                        imageList,
                        onToggleVisibility,
                        onDelete,
                    }}
                >
                    {Cell}
                </Grid>
            );
        }}
      </AutoSizer>
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
