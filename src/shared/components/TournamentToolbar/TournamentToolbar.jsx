import React, { useId } from "react";
import PropTypes from "prop-types";
import ToolbarGlass from "./ToolbarGlass";
import TournamentModeToolbar from "./TournamentModeToolbar";
import FilterModeToolbar from "./FilterModeToolbar";
import "./TournamentToolbar.css";

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
  className = "",
}) {
  const isTournament = mode === "tournament";
  const isHybrid = mode === "hybrid";
  const showFilters = isHybrid || mode === "profile";
  const toolbarGlassId = useId();
  const glassId = `toolbar-glass-${toolbarGlassId.replace(/:/g, "-")}`;

  return (
    <ToolbarGlass
      mode={isTournament ? "tournament" : "filter"}
      id={glassId}
      className={className}
    >
      {isTournament ? (
        <TournamentModeToolbar
          mode={mode}
          onToggleSwipeMode={onToggleSwipeMode}
          isSwipeMode={isSwipeMode}
          onToggleCatPictures={onToggleCatPictures}
          showCatPictures={showCatPictures}
          startTournamentButton={startTournamentButton}
        />
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
  className: PropTypes.string,
};

TournamentToolbar.displayName = "TournamentToolbar";

const MemoizedTournamentToolbar = React.memo(TournamentToolbar);
MemoizedTournamentToolbar.displayName = "TournamentToolbar";

export { MemoizedTournamentToolbar as TournamentToolbar };
