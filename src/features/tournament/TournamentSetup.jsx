/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Thin wrapper around NameManagementView with tournament-specific layout and extensions.
 */
import React, { useState, useCallback, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  NameManagementView,
  useNameManagementContext,
  Error,
  AnalysisDashboard,
  AnalysisBulkActions,
} from "../../shared/components";
import { exportTournamentResultsToCSV } from "../../shared/utils/exportUtils";
import { isNameHidden } from "../../shared/utils/nameFilterUtils";
import { useImageGallery, useAdminStatus } from "./hooks";
import {
  NameSelection,
  SwipeableNameCards,
  TournamentSidebar,
  Lightbox,
  NameSuggestionSection,
} from "./components";
import { useProfileStats } from "../profile/hooks/useProfileStats";
import { useProfileNameOperations } from "../profile/hooks/useProfileNameOperations";
import { useProfileNotifications } from "../profile/hooks/useProfileNotifications";
import { useProfileUser } from "../profile/hooks/useProfileUser";
import styles from "./TournamentSetup.module.css";

// * Error boundary component
const ErrorBoundary = Error;

// * Component that creates handlers inside context and initializes analysis mode
function AnalysisHandlersProvider({
  shouldEnableAnalysisMode,
  activeUser,
  canManageActiveUser,
  handlersRef,
  fetchSelectionStats,
  showSuccess,
  showError,
  showToast,
}) {
  const context = useNameManagementContext();

  // * Initialize analysis mode from URL or prop
  useEffect(() => {
    if (shouldEnableAnalysisMode && !context.analysisMode) {
      context.setAnalysisMode(true);
    }
  }, [shouldEnableAnalysisMode, context]);

  const setHiddenNames = useCallback(
    (updater) => {
      context.setHiddenIds(updater);
    },
    [context],
  );

  const setAllNames = useCallback(
    (updater) => {
      context.setNames(updater);
    },
    [context],
  );

  const fetchNames = useCallback(() => {
    context.refetch();
  }, [context]);

  const { handleToggleVisibility, handleDelete } = useProfileNameOperations(
    activeUser,
    canManageActiveUser,
    context.hiddenIds,
    setHiddenNames,
    setAllNames,
    fetchNames,
    fetchSelectionStats,
    showSuccess,
    showError,
    showToast,
  );

  React.useEffect(() => {
    handlersRef.current.handleToggleVisibility = handleToggleVisibility;
    handlersRef.current.handleDelete = handleDelete;
  }, [handleToggleVisibility, handleDelete, handlersRef]);

  return null;
}

AnalysisHandlersProvider.propTypes = {
  shouldEnableAnalysisMode: PropTypes.bool,
  activeUser: PropTypes.string,
  canManageActiveUser: PropTypes.bool,
  handlersRef: PropTypes.object.isRequired,
  fetchSelectionStats: PropTypes.func,
  showSuccess: PropTypes.func,
  showError: PropTypes.func,
  showToast: PropTypes.func,
};

// * Analysis Dashboard wrapper - no longer needs context
// * AnalysisDashboard fetches its own data and doesn't need highlights from context
function AnalysisDashboardWrapper({
  stats,
  selectionStats,
  highlights: propsHighlights,
}) {
  // * Only render if stats are available
  if (!stats) return null;

  return (
    <AnalysisDashboard
      stats={stats}
      selectionStats={selectionStats}
      highlights={propsHighlights}
    />
  );
}


AnalysisDashboardWrapper.propTypes = {
  stats: PropTypes.object,
  selectionStats: PropTypes.object,
  highlights: PropTypes.object,
};

// * Wrapper component factory to pass props to AnalysisDashboardWrapper
// * This creates a component function that can use hooks properly
const createAnalysisDashboardWrapper = (stats, selectionStats) => {
  return function AnalysisDashboardWrapperWithProps() {
    return <AnalysisDashboardWrapper stats={stats} selectionStats={selectionStats} />;
  };
};

function AnalysisBulkActionsWrapper({
  activeUser,
  canManageActiveUser,
  isAdmin,
  fetchSelectionStats,
  showSuccess,
  showError,
  showToast,
}) {
  const context = useNameManagementContext();

  const { selectedCount } = context;
  // * Keep both Set format for selection logic and original array for bulk operations
  const selectedNamesSet = useMemo(() =>
    context.selectedNames instanceof Set
      ? context.selectedNames
      : new Set(
          Array.isArray(context.selectedNames)
            ? context.selectedNames.map(name => typeof name === 'object' ? name.id : name)
            : [],
        ), [context.selectedNames]);

  // * Extract name IDs from selectedNames, handling different formats
  const selectedNamesArray = useMemo(() => {
    if (!context.selectedNames) return [];
    
    // * If it's a Set (profile mode), convert to array of IDs
    if (context.selectedNames instanceof Set) {
      return Array.from(context.selectedNames).filter(id => id != null);
    }
    
    // * If it's an array, extract IDs properly
    if (Array.isArray(context.selectedNames)) {
      return context.selectedNames
        .map(name => {
          // * If it's an object with an id property, extract it
          if (typeof name === 'object' && name !== null && name.id) {
            return name.id;
          }
          // * If it's already a string (ID), use it directly
          if (typeof name === 'string') {
            return name;
          }
          // * Otherwise, return null to filter out
          return null;
        })
        .filter(id => id != null); // * Filter out null/undefined values
    }
    
    return [];
  }, [context.selectedNames]);

  const setHiddenNames = useCallback(
    (updater) => {
      context.setHiddenIds(updater);
    },
    [context],
  );

  const setAllNames = useCallback(
    (updater) => {
      context.setNames(updater);
    },
    [context],
  );

  const fetchNames = useCallback(() => {
    context.refetch();
  }, [context]);

  const { handleBulkHide, handleBulkUnhide } = useProfileNameOperations(
    activeUser,
    canManageActiveUser,
    context.hiddenIds,
    setHiddenNames,
    setAllNames,
    fetchNames,
    fetchSelectionStats,
    showSuccess,
    showError,
    showToast,
  );

  const filteredAndSortedNames = useMemo(() => {
    if (!context.names || context.names.length === 0) return [];
    let filtered = [...context.names];

    // Use shared isNameHidden utility for consistent visibility check
    if (context.filterStatus === "active") {
      filtered = filtered.filter((name) => !isNameHidden(name));
    } else if (context.filterStatus === "hidden") {
      filtered = filtered.filter((name) => isNameHidden(name));
    }

    return filtered;
  }, [context.names, context.filterStatus]);

  const allVisibleSelected =
    filteredAndSortedNames.length > 0 &&
    filteredAndSortedNames.every((name) => selectedNamesSet.has(name.id));

  const handleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      filteredAndSortedNames.forEach((name) => {
        context.toggleNameById(name.id, false);
      });
    } else {
      filteredAndSortedNames.forEach((name) => {
        context.toggleNameById(name.id, true);
      });
    }
  }, [allVisibleSelected, filteredAndSortedNames, context]);

  const handleExport = useCallback(() => {
    exportTournamentResultsToCSV(filteredAndSortedNames, "naming_nosferatu_export");
  }, [filteredAndSortedNames]);

  if (!canManageActiveUser || filteredAndSortedNames.length === 0) {
    return null;
  }

  return (
    <AnalysisBulkActions
      selectedCount={selectedCount}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleSelectAll}
      onBulkHide={() => {
        if (process.env.NODE_ENV === "development") {
          console.log("[TournamentSetup] onBulkHide called", {
            selectedCount,
            selectedNamesArrayLength: selectedNamesArray.length,
            selectedNamesArray,
            contextSelectedNames: context.selectedNames,
          });
        }
        
        if (selectedNamesArray.length === 0) {
          console.warn("[TournamentSetup] No names in selectedNamesArray despite selectedCount:", selectedCount);
          showError("No names selected");
          return;
        }
        
        try {
          handleBulkHide(selectedNamesArray);
        } catch (error) {
          console.error("[TournamentSetup] Error calling handleBulkHide:", error);
          showError(`Failed to hide names: ${error.message || "Unknown error"}`);
        }
      }}
      onBulkUnhide={() => {
        if (selectedNamesArray.length === 0) {
          showError("No names selected");
          return;
        }
        handleBulkUnhide(selectedNamesArray);
      }}
      onExport={handleExport}
      isAllSelected={allVisibleSelected}
      showActions={true}
      isAdmin={isAdmin}
      totalCount={filteredAndSortedNames.length}
    />
  );
}

AnalysisBulkActionsWrapper.propTypes = {
  activeUser: PropTypes.string,
  canManageActiveUser: PropTypes.bool,
  isAdmin: PropTypes.bool,
  fetchSelectionStats: PropTypes.func,
  showSuccess: PropTypes.func,
  showError: PropTypes.func,
  showToast: PropTypes.func,
  onExport: PropTypes.func,
};

// * Tournament-specific component that uses NameManagementView context
function TournamentNameGrid({
  isAdmin,
  galleryImages,
  canManageActiveUser,
  onToggleVisibility,
  onDelete,
}) {
  const context = useNameManagementContext();

  // * Admin features only available in analysis mode
  const showAdminFeatures = context.analysisMode && canManageActiveUser;

  return (
    <div className={styles.stickyControls}>
      <NameSelection
        selectedNames={context.selectedNames}
        availableNames={context.names}
        onToggleName={context.toggleName}
        isAdmin={showAdminFeatures && isAdmin}
        selectedCategory={context.selectedCategory}
        searchTerm={context.searchTerm}
        sortBy={context.sortBy}
        filterStatus={showAdminFeatures ? context.filterStatus : "active"}
        isSwipeMode={context.isSwipeMode}
        showCatPictures={context.showCatPictures}
        imageList={galleryImages}
        SwipeableCards={SwipeableNameCards}
        showSelectedOnly={context.showSelectedOnly}
        onToggleVisibility={showAdminFeatures ? onToggleVisibility : undefined}
        onDelete={showAdminFeatures ? onDelete : undefined}
      />
    </div>
  );
}

TournamentNameGrid.propTypes = {
  isAdmin: PropTypes.bool,
  galleryImages: PropTypes.array,
  canManageActiveUser: PropTypes.bool,
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
};

function TournamentSetupContent({
  onStart,
  userName,
  enableAnalysisMode = false,
}) {
  // * Tournament-specific UI state (not managed by NameManagementView)
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const {
    galleryImages,
    addImages,
    isLoading: _imagesLoading,
    imageMap: _imageMap,
  } = useImageGallery({ isLightboxOpen: lightboxOpen });
  const isAdmin = useAdminStatus(userName);

  // * Profile hooks for analysis mode
  const { showSuccess, showError, showToast, ToastContainer } = useProfileNotifications();
  const {
    isAdmin: profileIsAdmin,
    activeUser,
    canManageActiveUser,
    userSelectOptions,
  } = useProfileUser(userName);
  const { stats, selectionStats, fetchSelectionStats } =
    useProfileStats(activeUser);

  // * Check URL for analysis mode parameter
  // const { currentRoute } = useRouting(); // Unused
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const shouldEnableAnalysisMode =
    enableAnalysisMode || urlParams.get("analysis") === "true";

  // * Create handlers ref that will be populated by a component inside context
  const handlersRef = React.useRef({
    handleToggleVisibility: null,
    handleDelete: null,
  });

  // * Lightbox handlers
  const handleImageOpen = useCallback(
    (image) => {
      const idx = galleryImages.indexOf(image);
      if (idx !== -1) {
        setLightboxIndex(idx);
        setLightboxOpen(true);
      }
    },
    [galleryImages],
  );

  const handleImagesUploaded = useCallback(
    (uploaded) => {
      addImages(uploaded);
    },
    [addImages],
  );

  const handleLightboxNavigate = useCallback((newIndex) => {
    setLightboxIndex(newIndex);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const preloadImages = useMemo(() => {
    if (!lightboxOpen || galleryImages.length === 0) return [];
    const preload = [];
    const prevIndex =
      lightboxIndex === 0 ? galleryImages.length - 1 : lightboxIndex - 1;
    const nextIndex =
      lightboxIndex === galleryImages.length - 1 ? 0 : lightboxIndex + 1;
    if (galleryImages[prevIndex]) preload.push(galleryImages[prevIndex]);
    if (galleryImages[nextIndex]) preload.push(galleryImages[nextIndex]);
    return preload;
  }, [lightboxOpen, lightboxIndex, galleryImages]);

  return (
    <>
      <ToastContainer />
      <div className={styles.container}>
      {/* Selection Panel - Contains NameManagementView */}
      <div className={styles.selectionPanel}>
        <NameManagementView
          mode="tournament"
          userName={userName}
          onStartTournament={onStart}
          tournamentProps={{
            SwipeableCards: SwipeableNameCards,
            isAdmin,
            imageList: galleryImages,
            gridClassName: styles.cardsContainer,
          }}
          profileProps={{
            isAdmin: canManageActiveUser,
            showUserFilter: profileIsAdmin,
            userSelectOptions,
            stats,
            selectionStats,
            onToggleVisibility: (nameId) =>
              handlersRef.current.handleToggleVisibility?.(nameId),
            onDelete: (name) => handlersRef.current.handleDelete?.(name),
          }}
          extensions={{
            dashboard: createAnalysisDashboardWrapper(stats, selectionStats),
            bulkActions: (props) => (
              <AnalysisBulkActionsWrapper
                activeUser={activeUser}
                canManageActiveUser={canManageActiveUser}
                isAdmin={isAdmin}
                fetchSelectionStats={fetchSelectionStats}
                showSuccess={showSuccess}
                showError={showError}
                showToast={showToast}
                {...props}
              />
            ),
            nameGrid: (
              <>
                <AnalysisHandlersProvider
                  shouldEnableAnalysisMode={shouldEnableAnalysisMode}
                  activeUser={activeUser}
                  canManageActiveUser={canManageActiveUser}
                  handlersRef={handlersRef}
                  fetchSelectionStats={fetchSelectionStats}
                  showSuccess={showSuccess}
                  showError={showError}
                  showToast={showToast}
                />
                <TournamentNameGrid
                  isAdmin={isAdmin}
                  galleryImages={galleryImages}
                  canManageActiveUser={canManageActiveUser}
                  onToggleVisibility={(nameId) =>
                    handlersRef.current.handleToggleVisibility?.(nameId)
                  }
                  onDelete={(name) => handlersRef.current.handleDelete?.(name)}
                />
              </>
            ),
            nameSuggestion: (
              <div className={styles.nameSuggestionWrapper}>
                <NameSuggestionSection />
              </div>
            ),
          }}
        />
      </div>

      {/* Sidebar */}
      <TournamentSidebar
        galleryImages={galleryImages}
        showAllPhotos={showAllPhotos}
        onShowAllPhotosToggle={() => setShowAllPhotos((v) => !v)}
        onImageOpen={handleImageOpen}
        isAdmin={isAdmin}
        userName={userName}
        onImagesUploaded={handleImagesUploaded}
      />

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={galleryImages}
          currentIndex={lightboxIndex}
          onClose={handleLightboxClose}
          onNavigate={handleLightboxNavigate}
          preloadImages={preloadImages}
        />
      )}
      <ToastContainer />
    </div>
  );
}

TournamentSetupContent.propTypes = {
  onStart: PropTypes.func.isRequired,
  userName: PropTypes.string,
  enableAnalysisMode: PropTypes.bool,
};

function TournamentSetup(props) {
  return (
    <ErrorBoundary variant="boundary">
      <TournamentSetupContent {...props} />
    </ErrorBoundary>
  );
}

TournamentSetup.displayName = "TournamentSetup";

TournamentSetup.propTypes = {
  onStart: PropTypes.func.isRequired,
  userName: PropTypes.string,
  enableAnalysisMode: PropTypes.bool,
};

export default TournamentSetup;
