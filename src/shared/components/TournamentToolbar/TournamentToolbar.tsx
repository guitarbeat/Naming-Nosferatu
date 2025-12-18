import React, { useId } from "react";
import PropTypes from "prop-types";
import { ToolbarGlass, BinaryToggle } from "./components";
import { TournamentButton } from "../Button";
import FilterModeToolbar from "./FilterModeToolbar";
import { styles } from "./styles";
import "./TournamentToolbar.css";

interface TournamentFilters {
  searchTerm?: string;
  category?: string;
  sortBy?: string;
  filterStatus?: string;
  userFilter?: string;
  selectionFilter?: string;
  sortOrder?: string;
  dateFilter?: string;
}

interface TournamentToolbarProps {
  mode?: "tournament" | "profile" | "hybrid";
  filters?: TournamentFilters;
  onFilterChange?: (name: string, value: string) => void;
  filteredCount?: number;
  totalCount?: number;
  categories?: string[];
  showUserFilter?: boolean;
  showSelectionFilter?: boolean;
  userOptions?: { value: string; label: string }[] | null;
  isSwipeMode?: boolean;
  onToggleSwipeMode?: () => void;
  showCatPictures?: boolean;
  onToggleCatPictures?: () => void;
  startTournamentButton?: {
    onClick: () => void;
    selectedCount: number;
  };
  analysisMode?: boolean;
  onOpenSuggestName?: () => void;
  className?: string;
}

function TournamentToolbar({
  mode = "tournament",
  filters = {},
  onFilterChange,
  filteredCount = 0,
  totalCount = 0,
  categories = [],
  showUserFilter = false,
  showSelectionFilter = false,
  userOptions = null,
  isSwipeMode,
  onToggleSwipeMode,
  showCatPictures,
  onToggleCatPictures,
  startTournamentButton,
  analysisMode = false,
  onOpenSuggestName,
  className = "",
}: TournamentToolbarProps) {
  const isTournament = mode === "tournament";
  const isHybrid = mode === "hybrid";
  const showFilters = isHybrid || mode === "profile";
  const toolbarGlassId = useId();
  const glassId = `toolbar-glass-${toolbarGlassId.replace(/:/g, "-")}`;

  // Tournament mode toolbar content
  const renderTournamentMode = () => {
    const selectedCount = startTournamentButton?.selectedCount ?? 0;
    const isReady = selectedCount >= 2;
    const countLabel =
      selectedCount === 1 ? "1 selected name" : `${selectedCount} selected names`;

    const buttonLabel = isReady
      ? `Start the tournament with ${countLabel}`
      : "Select at least 2 names to start";

    return (
      <div className={styles.unifiedContainer} data-mode={mode}>
        {(onToggleSwipeMode || onToggleCatPictures) && (
          <div className={styles.toggleStack}>
            {onToggleSwipeMode && (
              <BinaryToggle
                isActive={!!isSwipeMode}
                onClick={onToggleSwipeMode}
                activeLabel="Swipe"
                inactiveLabel="Tap"
                ariaLabel={
                  isSwipeMode ? "Switch to swipe mode" : "Switch to tap mode"
                }
              />
            )}
            {onToggleCatPictures && (
              <BinaryToggle
                isActive={!!showCatPictures}
                onClick={onToggleCatPictures}
                activeLabel="Cats"
                inactiveLabel="Names"
                ariaLabel={
                  showCatPictures ? "Hide cat pictures" : "Show cat pictures"
                }
              />
            )}
          </div>
        )}
        {onOpenSuggestName && (
          <button
            className={styles.suggestButton}
            onClick={onOpenSuggestName}
            aria-label="Suggest a new name"
          >
            Suggest Name
          </button>
        )}
        {startTournamentButton && (
          <TournamentButton
            onClick={startTournamentButton.onClick}
            disabled={!isReady}
            className={styles.startButton}
            ariaLabel={buttonLabel}
            startIcon={isReady ? undefined : null}
          >
            {buttonLabel}
          </TournamentButton>
        )}
      </div>
    );
  };

  return (
    <ToolbarGlass
      mode={isTournament ? "tournament" : "filter"}
      id={glassId}
      className={className}
    >
      {isTournament ? (
        renderTournamentMode()
      ) : (
        <FilterModeToolbar
          filters={filters}
          onFilterChange={onFilterChange}
          filteredCount={filteredCount}
          totalCount={totalCount}
          categories={categories}
          showUserFilter={showUserFilter}
          userOptions={userOptions}
          showSelectionFilter={showSelectionFilter}
          analysisMode={analysisMode}
          isHybrid={isHybrid}
          showFilters={showFilters}
        />
      )}
    </ToolbarGlass>
  );
}

const filterShape = PropTypes.shape({
  searchTerm: PropTypes.string,
  category: PropTypes.string,
  sortBy: PropTypes.string,
  filterStatus: PropTypes.string,
  userFilter: PropTypes.string,
  selectionFilter: PropTypes.string,
  sortOrder: PropTypes.string,
  dateFilter: PropTypes.string,
});

const optionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

TournamentToolbar.propTypes = {
  mode: PropTypes.oneOf(["tournament", "profile", "hybrid"]),
  filters: filterShape,
  onFilterChange: PropTypes.func, // Optional for tournament mode
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  categories: PropTypes.arrayOf(PropTypes.string),
  showUserFilter: PropTypes.bool,
  showSelectionFilter: PropTypes.bool,
  userOptions: PropTypes.arrayOf(optionShape),
  isSwipeMode: PropTypes.bool,
  onToggleSwipeMode: PropTypes.func,
  showCatPictures: PropTypes.bool,
  onToggleCatPictures: PropTypes.func,
  analysisMode: PropTypes.bool,
  startTournamentButton: PropTypes.shape({
    onClick: PropTypes.func.isRequired,
    selectedCount: PropTypes.number.isRequired,
  }),
  onOpenSuggestName: PropTypes.func,
  className: PropTypes.string,
};

TournamentToolbar.displayName = "TournamentToolbar";

const MemoizedTournamentToolbar = React.memo(TournamentToolbar);
MemoizedTournamentToolbar.displayName = "TournamentToolbar";

export { MemoizedTournamentToolbar as TournamentToolbar };
