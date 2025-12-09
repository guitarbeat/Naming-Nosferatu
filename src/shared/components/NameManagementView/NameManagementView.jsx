/**
 * @module NameManagementView
 * @description Unified view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import PropTypes from "prop-types";
import Loading from "../Loading/Loading";
import ErrorComponent from "../Error/Error";
import Button from "../Button/Button";
import { TournamentToolbar } from "../TournamentToolbar/TournamentToolbar";
import { NameGrid } from "../NameGrid/NameGrid";
import { AdminAnalytics } from "../AdminAnalytics";
import { useNameData } from "../../../core/hooks/useNameData";
import { useNameSelection } from "../../../core/hooks/useNameSelection";
import useAppStore from "../../../core/store/useAppStore";
import { useRouting } from "@hooks/useRouting";
import { exportTournamentResultsToCSV } from "../../utils/exportUtils";
import { FILTER_OPTIONS } from "../../../core/constants";
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
 * Safe hook to get NameManagementContext - returns null if not available
 * Use this when the context is optional (e.g., in extension components)
 */
export function useNameManagementContextSafe() {
  const context = useContext(NameManagementContext);
  return context; // * Returns null if not available
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
 * @param {ReactNode} props.extensions.navbar - Navbar component (tournament mode)
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
    selectAll: _selectAll,
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
  const [filterStatus, setFilterStatus] = useState(
    FILTER_OPTIONS.VISIBILITY.VISIBLE
  );
  const [userFilter, setUserFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectionFilter, setSelectionFilter] = useState("all");
  const [filteredCount] = useState(0);

  // * Routing hook for URL updates
  const { navigateTo } = useRouting();

  // * Analysis mode: toggle for showing profile features in tournament mode
  // * Initialize from URL parameter
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const [analysisMode, setAnalysisMode] = useState(
    urlParams.get("analysis") === "true"
  );

  // * Sync analysis mode with URL
  const handleAnalysisModeToggle = useCallback(
    (newValue) => {
      setAnalysisMode(newValue);
      const currentPath = window.location.pathname;
      const currentSearch = new URLSearchParams(window.location.search);

      if (newValue) {
        currentSearch.set("analysis", "true");
      } else {
        currentSearch.delete("analysis");
      }

      const newSearch = currentSearch.toString();
      const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;

      navigateTo(newUrl);
    },
    [navigateTo]
  );

  // * Sync analysis mode state when URL changes (e.g., from keyboard shortcut)
  useEffect(() => {
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlAnalysisMode = params.get("analysis") === "true";
      if (urlAnalysisMode !== analysisMode) {
        setAnalysisMode(urlAnalysisMode);
      }
    };

    // * Check on mount and when URL changes
    checkUrl();
    window.addEventListener("popstate", checkUrl);
    return () => window.removeEventListener("popstate", checkUrl);
  }, [analysisMode]);

  // * Tournament mode: categories
  const categories = tournamentProps.categories || [];

  // * Names are passed directly to child components which handle their own filtering
  const displayNames = names;

  // * Filter configuration for TournamentToolbar
  const filterConfig = useMemo(() => {
    // * In tournament mode with analysis mode, show hybrid filters
    if (mode === "tournament" && analysisMode) {
      return {
        searchTerm,
        category: selectedCategory,
        sortBy,
        filterStatus,
        userFilter,
        selectionFilter,
        sortOrder,
      };
    } else if (mode === "tournament") {
      return {
        searchTerm,
        category: selectedCategory,
        sortBy,
        sortOrder,
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
    analysisMode,
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
      // * Tournament mode with analysis mode: handle both filter sets
      if (mode === "tournament" && analysisMode) {
        if (newFilters.searchTerm !== undefined) {
          setSearchTerm(newFilters.searchTerm || "");
        }
        if (newFilters.category !== undefined) {
          setSelectedCategory(newFilters.category || null);
        }
        if (newFilters.sortBy !== undefined) {
          setSortBy(newFilters.sortBy || "alphabetical");
        }
        if (newFilters.filterStatus !== undefined) {
          setFilterStatus(newFilters.filterStatus);
        }
        if (newFilters.userFilter !== undefined) {
          setUserFilter(newFilters.userFilter);
        }
        if (newFilters.selectionFilter !== undefined) {
          setSelectionFilter(newFilters.selectionFilter);
        }
        if (newFilters.sortOrder !== undefined) {
          setSortOrder(newFilters.sortOrder);
        }
      } else if (mode === "tournament") {
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
    [mode, analysisMode]
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
      // Analysis mode
      analysisMode,
      setAnalysisMode: handleAnalysisModeToggle,
      // Additional data for toolbar integration
      categories: tournamentProps.categories || [],
      filteredCount,
      totalCount: names.length,
      profileProps,
      tournamentProps,
      mode,
      handleFilterChange,
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
      filteredCount,
      tournamentProps,
      profileProps,
      mode,
      handleFilterChange,
      // State values
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
      filterStatus,
      setFilterStatus,
      userFilter,
      setUserFilter,
      sortOrder,
      setSortOrder,
      selectionFilter,
      setSelectionFilter,
      analysisMode,
      handleAnalysisModeToggle,
    ]
  );

  // * Memoize TournamentToolbar props for tournament mode (must be before all early returns)
  const tournamentFilterConfig = useMemo(
    () => ({
      searchTerm,
      category: selectedCategory,
      sortBy,
      sortOrder,
    }),
    [searchTerm, selectedCategory, sortBy, sortOrder]
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
    <>
      {/* TournamentToolbar with Start Tournament button (tournament mode) */}
      {/* Note: In analysis mode, toolbar is integrated into CollapsibleHeader via dashboard extension */}
      {mode === "tournament" && !analysisMode && (
        <TournamentToolbar
          mode="tournament"
          filters={tournamentFilterConfig}
          onFilterChange={handleFilterChange}
          categories={categories}
          showUserFilter={profileProps.showUserFilter}
          showSelectionFilter={!!profileProps.selectionStats}
          userSelectOptions={profileProps.userSelectOptions}
          filteredCount={names.length}
          totalCount={names.length}
          selectedCount={selectedCount}
          showSelectedOnly={showSelectedOnly}
          onToggleShowSelected={() => setShowSelectedOnly(!showSelectedOnly)}
          isSwipeMode={isSwipeMode}
          onToggleSwipeMode={() => setIsSwipeMode(!isSwipeMode)}
          showCatPictures={showCatPictures}
          onToggleCatPictures={() => setShowCatPictures(!showCatPictures)}
          analysisMode={false}
          startTournamentButton={
            selectedCount >= 2 && onStartTournament
              ? {
                  onClick: () => onStartTournament(selectedNames),
                  selectedCount,
                }
              : undefined
          }
        />
      )}
      <NameManagementContext.Provider value={contextValue}>
        <div
          className={`${styles.container} ${className}`}
          data-component="name-management-view"
          data-mode={mode}
          role="main"
          aria-label={`${mode === "tournament" ? "Tournament" : "Profile"} name management`}
        >
          {/* Analysis Mode Banner - Removed per user request */}

          {/* Mode-specific Header */}
          {extensions.header && (
            <div className={styles.headerSection}>
              {typeof extensions.header === "function"
                ? extensions.header()
                : extensions.header}
            </div>
          )}

          {/* Profile Dashboard (profile mode or analysis mode) */}
          {(mode === "profile" || (mode === "tournament" && analysisMode)) &&
            extensions.dashboard && (
              <section
                className={styles.dashboardSection}
                aria-label="Dashboard and statistics"
                data-section="dashboard"
              >
                {React.isValidElement(extensions.dashboard)
                  ? extensions.dashboard
                  : typeof extensions.dashboard === "function"
                    ? React.createElement(extensions.dashboard)
                    : extensions.dashboard}
              </section>
            )}

          {/* Admin Analytics - Merged into AnalysisDashboard, only show if dashboard not available */}
          {analysisMode && tournamentProps.isAdmin && !extensions.dashboard && (
            <section
              className={styles.dashboardSection}
              aria-label="Admin analytics"
              data-section="admin-analytics"
            >
              <AdminAnalytics isAdmin={tournamentProps.isAdmin} />
            </section>
          )}

          {/* Tournament Toolbar - Only for profile/hybrid mode (tournament mode filters are rendered above) */}
          {/* Note: In analysis mode, toolbar is integrated into CollapsibleHeader via dashboard extension */}
          {mode !== "tournament" && !analysisMode && (
            <section
              className={styles.filtersSection}
              aria-label="Filter and search controls"
              data-section="filters"
            >
              <TournamentToolbar
                mode={mode}
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                categories={categories}
                showUserFilter={profileProps.showUserFilter}
                showSelectionFilter={!!profileProps.selectionStats}
                userSelectOptions={profileProps.userSelectOptions}
                filteredCount={filteredCount}
                totalCount={names.length}
              />
            </section>
          )}

          {/* Tournament Mode: Header Actions - hidden when custom nameGrid is used (actions are in ResultsInfo) */}
          {mode === "tournament" && !extensions.nameGrid && (
            <nav
              className={styles.tournamentActions}
              aria-label="Tournament action buttons"
              data-section="tournament-actions"
            >
              {selectedCount > 0 && !analysisMode && (
                <Button
                  variant={showSelectedOnly ? "primary" : "secondary"}
                  size="small"
                  onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                  className={styles.actionButton}
                >
                  {showSelectedOnly ? "👁️ Show All" : "👀 Show Selected"}
                </Button>
              )}

              {/* View mode toggles - only show when not in analysis mode */}
              {!analysisMode && (
                <>
                  <Button
                    variant={isSwipeMode ? "primary" : "secondary"}
                    size="small"
                    onClick={() => setIsSwipeMode(!isSwipeMode)}
                    className={styles.actionButton}
                  >
                    {isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
                  </Button>

                  <Button
                    variant={showCatPictures ? "primary" : "secondary"}
                    size="small"
                    onClick={() => setShowCatPictures(!showCatPictures)}
                    className={styles.actionButton}
                  >
                    {showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
                  </Button>
                </>
              )}

              {/* * Start Tournament button - hidden when Analysis Mode is active */}
              {selectedCount >= 2 && onStartTournament && !analysisMode && (
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => onStartTournament(selectedNames)}
                  className={styles.startButton}
                >
                  Start Tournament
                </Button>
              )}
            </nav>
          )}

          {/* Tournament Mode: Progress Bar - hidden when custom nameGrid is used (it includes ResultsInfo) */}
          {mode === "tournament" && !analysisMode && !extensions.nameGrid && (
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

          {/* Profile Mode: Bulk Actions (profile mode or analysis mode) */}
          {(mode === "profile" || (mode === "tournament" && analysisMode)) &&
            extensions.bulkActions && (
              <section
                className={styles.bulkActionsSection}
                aria-label="Bulk actions"
                data-section="bulk-actions"
              >
                {typeof extensions.bulkActions === "function"
                  ? React.createElement(extensions.bulkActions, {
                      onExport: () => {
                        exportTournamentResultsToCSV(
                          displayNames,
                          "naming_nosferatu_export"
                        );
                      },
                    })
                  : extensions.bulkActions}
              </section>
            )}

          {/* Name Grid - Use extension if provided, otherwise use NameGrid */}
          {/* * Always show extension (handles swipe mode internally), but hide default NameGrid in swipe mode */}
          <section
            className={styles.gridSection}
            aria-label="Name selection grid"
            data-section="name-grid"
          >
            {extensions.nameGrid ? (
              typeof extensions.nameGrid === "function" ? (
                // * Call function directly to render inside Provider context
                extensions.nameGrid()
              ) : React.isValidElement(extensions.nameGrid) ? (
                // * Clone element to ensure it has access to context
                React.cloneElement(extensions.nameGrid)
              ) : (
                extensions.nameGrid
              )
            ) : !(mode === "tournament" && isSwipeMode) ? (
              <NameGrid
                names={displayNames}
                selectedNames={selectedNames}
                onToggleName={toggleName}
                filters={filterConfig}
                isAdmin={
                  mode === "profile" || (mode === "tournament" && analysisMode)
                    ? profileProps.isAdmin
                    : false
                }
                showSelectedOnly={
                  mode === "tournament" && !analysisMode
                    ? showSelectedOnly
                    : false
                }
                showCatPictures={showCatPictures}
                imageList={tournamentProps.imageList || []}
                onToggleVisibility={profileProps.onToggleVisibility}
                onDelete={profileProps.onDelete}
                className={
                  mode === "tournament" ? tournamentProps.gridClassName : ""
                }
              />
            ) : null}
          </section>

          {/* Mode-specific Extensions */}
          {extensions.navbar && (
            <div className={styles.navbarSection}>
              {typeof extensions.navbar === "function"
                ? extensions.navbar()
                : extensions.navbar}
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
    </>
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
    navbar: PropTypes.node,
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
    stats: PropTypes.object,
    selectionStats: PropTypes.object,
    highlights: PropTypes.object,
    isAdmin: PropTypes.bool,
    showUserFilter: PropTypes.bool,
    userSelectOptions: PropTypes.array,
  }),
  className: PropTypes.string,
};
