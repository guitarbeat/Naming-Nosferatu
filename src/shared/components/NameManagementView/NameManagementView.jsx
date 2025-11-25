/**
 * @module NameManagementView
 * @description Unified view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import React, {
  useState,
  useMemo,
  useCallback,
  createContext,
  useContext,
} from "react";
import PropTypes from "prop-types";
import {
  Loading,
  Error as ErrorComponent,
  UnifiedFilters,
  NameGrid,
} from "../index";
import { useNameData } from "../../../core/hooks/useNameData";
import { useNameSelection } from "../../../core/hooks/useNameSelection";
import useAppStore from "../../../core/store/useAppStore";
import styles from "./NameManagementView.module.css";

// * Context for providing data to extensions
const NameManagementContext = createContext(null);

export function useNameManagementContext() {
  const context = useContext(NameManagementContext);
  if (!context) {
    throw new Error(
      "useNameManagementContext must be used within NameManagementView"
    );
  }
  return context;
}

/**
 * Unified Name Management View Component
 * @param {Object} props
 * @param {string} props.mode - Display mode: 'tournament' or 'profile'
 * @param {string} props.userName - Current user name
 * @param {Function} props.onStartTournament - Handler for starting tournament (tournament mode only)
 * @param {Object} props.extensions - Mode-specific extension components
 * @param {ReactNode} props.extensions.header - Custom header component
 * @param {ReactNode} props.extensions.dashboard - Dashboard component (profile mode)
 * @param {ReactNode} props.extensions.bulkActions - Bulk actions component (profile mode)
 * @param {ReactNode} props.extensions.sidebar - Sidebar component (tournament mode)
 * @param {ReactNode} props.extensions.lightbox - Lightbox component (tournament mode)
 * @param {ReactNode} props.extensions.nameSuggestion - Name suggestion component (tournament mode)
 * @param {Object} props.tournamentProps - Tournament-specific props
 * @param {Array} props.tournamentProps.categories - Available categories
 * @param {Function} props.tournamentProps.SwipeableCards - Swipeable cards component
 * @param {boolean} props.tournamentProps.isAdmin - Admin status
 * @param {Object} props.profileProps - Profile-specific props
 * @param {Function} props.profileProps.onToggleVisibility - Visibility toggle handler
 * @param {Function} props.profileProps.onDelete - Delete handler
 * @param {Set} props.profileProps.hiddenIds - Set of hidden name IDs
 * @param {Object} props.profileProps.stats - Profile statistics
 * @param {Object} props.profileProps.selectionStats - Selection statistics
 * @param {Object} props.profileProps.highlights - Profile highlights
 */
export function NameManagementView({
  mode = "tournament",
  userName,
  onStartTournament,
  extensions = {},
  tournamentProps = {},
  profileProps = {},
  className = "",
}) {
  // * Unified data fetching
  const {
    names,
    hiddenIds,
    isLoading,
    error: dataError,
    refetch,
    setNames,
    setHiddenIds,
  } = useNameData({ userName, mode });

  // * Unified selection management
  const {
    selectedNames,
    toggleName,
    toggleNameById,
    selectAll,
    clearSelection,
    selectedCount,
  } = useNameSelection({
    names,
    mode,
    userName,
  });

  // * Get error state from store (tournament mode)
  const { errors, errorActions } = useAppStore();
  const isError = mode === "tournament" && (!!errors.current || !!dataError);
  const clearErrors = () => errorActions.clearError();
  const clearError = () => errorActions.clearError();

  // * Tournament mode: filter state
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showCatPictures, setShowCatPictures] = useState(false);

  // * Profile mode: filter state
  const [filterStatus, setFilterStatus] = useState("active");
  const [userFilter, setUserFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectionFilter, setSelectionFilter] = useState("all");
  const [filteredCount, setFilteredCount] = useState(0);

  // * Tournament mode: categories
  const categories = tournamentProps.categories || [];

  // * Names are passed directly to child components which handle their own filtering
  const displayNames = names;

  // * Filter configuration for UnifiedFilters
  const filterConfig = useMemo(() => {
    if (mode === "tournament") {
      return {
        searchTerm,
        category: selectedCategory,
        sortBy,
      };
    } else {
      return {
        filterStatus,
        userFilter,
        selectionFilter,
        sortBy,
        sortOrder,
      };
    }
  }, [
    mode,
    searchTerm,
    selectedCategory,
    sortBy,
    filterStatus,
    userFilter,
    selectionFilter,
    sortOrder,
  ]);

  // * Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters) => {
      if (mode === "tournament") {
        setSearchTerm(newFilters.searchTerm || "");
        setSelectedCategory(newFilters.category || null);
        setSortBy(newFilters.sortBy || "alphabetical");
      } else {
        if (newFilters.filterStatus !== undefined) {
          setFilterStatus(newFilters.filterStatus);
        }
        if (newFilters.userFilter !== undefined) {
          setUserFilter(newFilters.userFilter);
        }
        if (newFilters.selectionFilter !== undefined) {
          setSelectionFilter(newFilters.selectionFilter);
        }
        if (newFilters.sortBy !== undefined) {
          setSortBy(newFilters.sortBy);
        }
        if (newFilters.sortOrder !== undefined) {
          setSortOrder(newFilters.sortOrder);
        }
      }
    },
    [mode]
  );

  // * Context value for extensions
  const contextValue = useMemo(
    () => ({
      names,
      selectedNames,
      toggleName,
      toggleNameById,
      selectedCount,
      hiddenIds,
      filterConfig,
      refetch,
      setNames,
      setHiddenIds,
      // Tournament-specific
      showSelectedOnly,
      setShowSelectedOnly,
      selectedCategory,
      setSelectedCategory,
      searchTerm,
      setSearchTerm,
      sortBy,
      setSortBy,
      isSwipeMode,
      setIsSwipeMode,
      showCatPictures,
      setShowCatPictures,
      // Profile-specific
      filterStatus,
      setFilterStatus,
      userFilter,
      setUserFilter,
      sortOrder,
      setSortOrder,
      selectionFilter,
      setSelectionFilter,
    }),
    [
      names,
      selectedNames,
      toggleName,
      toggleNameById,
      selectedCount,
      hiddenIds,
      filterConfig,
      refetch,
      setNames,
      setHiddenIds,
      showSelectedOnly,
      selectedCategory,
      searchTerm,
      sortBy,
      isSwipeMode,
      showCatPictures,
      filterStatus,
      userFilter,
      sortOrder,
      selectionFilter,
    ]
  );

  // * Loading state - check after all hooks
  if (isLoading) {
    return <Loading variant="spinner" />;
  }

  // * Error state (tournament mode) - check after all hooks
  if (isError && mode === "tournament") {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Error Loading Names</h2>
          <ErrorComponent
            errors={errors.current ? [errors.current] : []}
            onRetry={() => window.location.reload()}
            onDismiss={clearError}
            onClearAll={clearErrors}
            showDetails={process.env.NODE_ENV === "development"}
          />
        </div>
      </div>
    );
  }

  // * Empty state - check after all hooks
  if (names.length === 0) {
    return (
      <div className={styles.container}>
        <h2>
          {mode === "tournament" ? "No Names Available" : "No Data Available"}
        </h2>
        <p className={styles.errorMessage}>
          {mode === "tournament"
            ? "There are no names available for the tournament at this time."
            : "No names found in your profile."}
        </p>
      </div>
    );
  }

  return (
    <NameManagementContext.Provider value={contextValue}>
      <div className={`${styles.container} ${className}`}>
        {/* Mode-specific Header */}
        {extensions.header && (
          <div className={styles.headerSection}>
            {typeof extensions.header === "function"
              ? extensions.header()
              : extensions.header}
          </div>
        )}

        {/* Profile Dashboard (profile mode only) */}
        {mode === "profile" && extensions.dashboard && (
          <div className={styles.dashboardSection}>
            {typeof extensions.dashboard === "function"
              ? extensions.dashboard()
              : extensions.dashboard}
          </div>
        )}

        {/* Unified Filters */}
        <div className={styles.filtersSection}>
          <UnifiedFilters
            mode={mode}
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            categories={categories}
            showUserFilter={profileProps.showUserFilter}
            showSelectionFilter={!!profileProps.selectionStats}
            userSelectOptions={profileProps.userSelectOptions}
            filteredCount={
              mode === "profile" ? filteredCount : displayNames.length
            }
            totalCount={names.length}
          />
        </div>

        {/* Tournament Mode: Header Actions */}
        {mode === "tournament" && (
          <div className={styles.tournamentActions}>
            {selectedCount > 0 && (
              <button
                className={`${styles.actionButton} ${
                  showSelectedOnly ? styles.actionButtonActive : ""
                }`}
                onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                type="button"
              >
                {showSelectedOnly ? "👁️ Show All" : "👀 Show Selected"}
              </button>
            )}

            {tournamentProps.isAdmin && (
              <button
                className={styles.actionButton}
                onClick={selectAll}
                type="button"
              >
                {selectedCount === names.length
                  ? "✨ Start Fresh"
                  : "🎲 Select All"}
              </button>
            )}

            <button
              onClick={() => setIsSwipeMode(!isSwipeMode)}
              className={`${styles.actionButton} ${
                isSwipeMode ? styles.actionButtonActive : ""
              }`}
              type="button"
            >
              {isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
            </button>

            <button
              onClick={() => setShowCatPictures(!showCatPictures)}
              className={`${styles.actionButton} ${
                showCatPictures ? styles.actionButtonActive : ""
              }`}
              type="button"
            >
              {showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
            </button>

            {selectedCount >= 2 && onStartTournament && (
              <button
                className={styles.startButton}
                onClick={() => onStartTournament(selectedNames)}
                type="button"
              >
                Start Tournament ({selectedCount})
              </button>
            )}
          </div>
        )}

        {/* Tournament Mode: Progress Bar */}
        {mode === "tournament" && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.max(
                    (selectedCount / Math.max(names.length, 1)) * 100,
                    5
                  )}%`,
                }}
              />
            </div>
            <span className={styles.progressText}>
              {selectedCount} of {names.length} names selected
            </span>
          </div>
        )}

        {/* Profile Mode: Bulk Actions */}
        {mode === "profile" && extensions.bulkActions && (
          <div className={styles.bulkActionsSection}>
            {typeof extensions.bulkActions === "function"
              ? extensions.bulkActions()
              : extensions.bulkActions}
          </div>
        )}

        {/* Name Grid - Use extension if provided, otherwise use NameGrid */}
        <div className={styles.gridSection}>
          {extensions.nameGrid ? (
            typeof extensions.nameGrid === "function" ? (
              extensions.nameGrid()
            ) : (
              extensions.nameGrid
            )
          ) : (
            <NameGrid
              names={displayNames}
              selectedNames={selectedNames}
              onToggleName={toggleName}
              filters={filterConfig}
              mode={mode}
              isAdmin={
                mode === "profile"
                  ? profileProps.isAdmin
                  : tournamentProps.isAdmin
              }
              showSelectedOnly={
                mode === "tournament" ? showSelectedOnly : false
              }
              showCatPictures={showCatPictures}
              imageList={tournamentProps.imageList || []}
              hiddenIds={
                mode === "profile" ? profileProps.hiddenIds : new Set()
              }
              onToggleVisibility={profileProps.onToggleVisibility}
              onDelete={profileProps.onDelete}
              className={
                mode === "tournament" ? tournamentProps.gridClassName : ""
              }
            />
          )}
        </div>

        {/* Tournament Mode: Floating Start Button */}
        {mode === "tournament" && selectedCount >= 2 && onStartTournament && (
          <div className={styles.floatingStartButton}>
            <button
              className={styles.startButton}
              onClick={() => onStartTournament(selectedNames)}
              type="button"
            >
              Start Tournament ({selectedCount})
            </button>
          </div>
        )}

        {/* Mode-specific Extensions */}
        {extensions.sidebar && (
          <div className={styles.sidebarSection}>
            {typeof extensions.sidebar === "function"
              ? extensions.sidebar()
              : extensions.sidebar}
          </div>
        )}

        {extensions.lightbox && (
          <div className={styles.lightboxSection}>
            {typeof extensions.lightbox === "function"
              ? extensions.lightbox()
              : extensions.lightbox}
          </div>
        )}

        {extensions.nameSuggestion && (
          <div className={styles.nameSuggestionSection}>
            {typeof extensions.nameSuggestion === "function"
              ? extensions.nameSuggestion()
              : extensions.nameSuggestion}
          </div>
        )}
      </div>
    </NameManagementContext.Provider>
  );
}

NameManagementView.propTypes = {
  mode: PropTypes.oneOf(["tournament", "profile"]),
  userName: PropTypes.string.isRequired,
  onStartTournament: PropTypes.func,
  extensions: PropTypes.shape({
    header: PropTypes.node,
    dashboard: PropTypes.node,
    bulkActions: PropTypes.node,
    sidebar: PropTypes.node,
    lightbox: PropTypes.node,
    nameSuggestion: PropTypes.node,
    nameGrid: PropTypes.node,
  }),
  tournamentProps: PropTypes.shape({
    categories: PropTypes.arrayOf(PropTypes.string),
    SwipeableCards: PropTypes.elementType,
    isAdmin: PropTypes.bool,
    imageList: PropTypes.arrayOf(PropTypes.string),
    gridClassName: PropTypes.string,
  }),
  profileProps: PropTypes.shape({
    onToggleVisibility: PropTypes.func,
    onDelete: PropTypes.func,
    hiddenIds: PropTypes.instanceOf(Set),
    stats: PropTypes.object,
    selectionStats: PropTypes.object,
    highlights: PropTypes.object,
    isAdmin: PropTypes.bool,
    showUserFilter: PropTypes.bool,
    userSelectOptions: PropTypes.array,
  }),
  className: PropTypes.string,
};
