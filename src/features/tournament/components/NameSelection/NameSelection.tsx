/**
 * @module NameSelection
 * @description Name selection component for tournament setup.
 * Simplified: uses unified filtering, no duplicate logic.
 */
import { useMemo, memo } from "react";
import PropTypes from "prop-types";
import { NameGrid } from "../../../../shared/components/NameGrid/NameGrid";
import {
  applyNameFilters,
  mapFilterStatusToVisibility,
} from "../../../../shared/utils/nameFilterUtils";
import { NameItem } from "../../../../shared/propTypes";
import styles from "../../TournamentSetup.module.css";

interface NameSelectionProps {
  selectedNames: NameItem[];
  availableNames: NameItem[];
  onToggleName: (name: NameItem) => void;
  onStartTournament?: (names: NameItem[]) => void;
  isAdmin?: boolean;
  selectedCategory?: string;
  searchTerm?: string;
  sortBy?: string;
  filterStatus?: "visible" | "hidden" | "all";
  isSwipeMode?: boolean;
  onToggleSwipeMode?: () => void;
  showCatPictures?: boolean;
  onToggleCatPictures?: () => void;
  imageList?: string[];
  SwipeableCards?: React.ComponentType<{
    names: NameItem[];
    selectedNames: NameItem[];
    onToggleName: (name: NameItem) => void;
    isAdmin?: boolean;
    showCatPictures?: boolean;
    imageList?: string[];
    onStartTournament?: (names: NameItem[]) => void;
  }>;
  showSelectedOnly?: boolean;
  onToggleShowSelected?: () => void;
  analysisMode?: boolean;
  onToggleVisibility?: (nameId: string | number) => void;
  onDelete?: (name: NameItem) => void;
}

function NameSelection({
  selectedNames,
  availableNames,
  onToggleName,
  onStartTournament,
  isAdmin,
  // Filters
  selectedCategory,
  searchTerm,
  sortBy,
  filterStatus,
  // Display options
  isSwipeMode,
  onToggleSwipeMode: _onToggleSwipeMode, // * Handled by TournamentToolbar in NameManagementView
  showCatPictures,
  onToggleCatPictures: _onToggleCatPictures, // * Handled by TournamentToolbar in NameManagementView
  imageList,
  SwipeableCards,
  showSelectedOnly,
  onToggleShowSelected: _onToggleShowSelected, // * Handled by TournamentToolbar in NameManagementView
  analysisMode: _analysisMode, // * Handled by TournamentToolbar in NameManagementView
  // Admin handlers
  onToggleVisibility,
  onDelete,
}: NameSelectionProps) {
  // Build filter config
  const filters = useMemo(
    () => ({
      searchTerm,
      category: selectedCategory,
      sortBy,
      filterStatus,
    }),
    [searchTerm, selectedCategory, sortBy, filterStatus],
  );

  // Calculate filtered names for display count and swipe mode
  const filteredNames = useMemo(() => {
    const visibility = mapFilterStatusToVisibility(filterStatus || "visible");

    let result = applyNameFilters(availableNames, {
      searchTerm,
      category: selectedCategory,
      sortBy,
      visibility,
      isAdmin,
    });

    if (showSelectedOnly) {
      result = result.filter((name) =>
        selectedNames.some((selected) => {
          const nameId = name.id;
          const selectedId = selected.id;
          return nameId !== undefined && selectedId !== undefined && nameId === selectedId;
        }),
      );
    }

    return result;
  }, [
    availableNames,
    searchTerm,
    selectedCategory,
    sortBy,
    filterStatus,
    isAdmin,
    showSelectedOnly,
    selectedNames,
  ]);

  return (
    <div className={styles.nameSelection}>
      {isSwipeMode && (
        <div className={styles.swipeModeInstructions}>
          <span>👈 Swipe left to remove • 👉 Swipe right to select</span>
        </div>
      )}

      {isSwipeMode && SwipeableCards ? (
        <SwipeableCards
          names={filteredNames}
          selectedNames={selectedNames}
          onToggleName={onToggleName}
          isAdmin={isAdmin}
          showCatPictures={showCatPictures}
          imageList={imageList}
          onStartTournament={onStartTournament}
        />
      ) : (
        <NameGrid
          names={availableNames}
          selectedNames={selectedNames}
          onToggleName={onToggleName}
          filters={filters}
          isAdmin={isAdmin}
          showSelectedOnly={showSelectedOnly}
          showCatPictures={showCatPictures}
          imageList={imageList}
          onToggleVisibility={onToggleVisibility}
          onDelete={onDelete}
          className={styles.cardsContainer}
        />
      )}
    </div>
  );
}

NameSelection.propTypes = {
  selectedNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  availableNames: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleName: PropTypes.func.isRequired,
  onStartTournament: PropTypes.func,
  isAdmin: PropTypes.bool,
  selectedCategory: PropTypes.string,
  searchTerm: PropTypes.string,
  sortBy: PropTypes.string,
  filterStatus: PropTypes.oneOf(["visible", "hidden", "all"]),
  isSwipeMode: PropTypes.bool,
  onToggleSwipeMode: PropTypes.func,
  showCatPictures: PropTypes.bool,
  onToggleCatPictures: PropTypes.func,
  imageList: PropTypes.arrayOf(PropTypes.string),
  SwipeableCards: PropTypes.elementType,
  showSelectedOnly: PropTypes.bool,
  onToggleShowSelected: PropTypes.func,
  analysisMode: PropTypes.bool,
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
};

export default memo(NameSelection);
