/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Thin wrapper around NameManagementView with tournament-specific layout and extensions.
 */
import React, { useState, useCallback, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  NameManagementView,
  useNameManagementContextSafe,
} from "../../shared/components/NameManagementView/NameManagementView.tsx";
import Error from "../../shared/components/Error/Error";
import { AnalysisDashboard } from "../../shared/components/AnalysisDashboard/AnalysisDashboard";
import { AnalysisBulkActions } from "../../shared/components/AnalysisPanel/components/AnalysisBulkActions";
import { exportTournamentResultsToCSV } from "../../shared/utils/coreUtils";
import { isNameHidden, selectedNamesToSet } from "../../shared/utils/coreUtils";

// Inline extractNameIds - simple utility only used here
function extractNameIds(selectedNamesValue) {
  if (Array.isArray(selectedNamesValue)) {
    return selectedNamesValue.map((n) => n.id);
  }
  return Array.from(selectedNamesValue);
}
import { useImageGallery } from "./hooks/useImageGallery";
import { useAdminStatus } from "../../shared/hooks/useAppHooks";
import { NameSelection } from "./components/NameSelection/NameSelection";
import { SwipeableNameCards } from "./components/SwipeMode/SwipeableNameCards";
import Lightbox from "./components/Lightbox";
import { PhotoGallery } from "./components/TournamentSidebar/PhotoComponents";
import { useProfile } from "../profile/hooks/useProfile";
import { useProfileNotifications } from "../profile/hooks/useProfileNotifications.jsx";
import { FILTER_OPTIONS } from "../../core/constants";
import useAppStore from "../../core/store/useAppStore";
import styles from "./TournamentSetup.module.css";

// * Error boundary component
const ErrorBoundary = Error;

// * Shared hook for context callbacks
function useNameManagementCallbacks(context) {
  const setHiddenNames = useCallback(
    (updater) => {
      context?.setHiddenIds?.(updater);
    },
    [context],
  );

  const setAllNames = useCallback(
    (updater) => {
      context?.setNames?.(updater);
    },
    [context],
  );

  const fetchNames = useCallback(() => {
    context?.refetch?.();
  }, [context]);

  return { setHiddenNames, setAllNames, fetchNames };
}

// * Component that creates handlers inside context and initializes analysis mode
function AnalysisHandlersProvider({
  shouldEnableAnalysisMode,
  activeUser,
  canManageActiveUser: _canManageActiveUser,
  handlersRef,
  fetchSelectionStats: _fetchSelectionStats,
  showSuccess,
  showError,
  showToast: _showToast,
}) {
  const context = useNameManagementContextSafe();

  // * Initialize analysis mode from URL or prop
  useEffect(() => {
    if (!context) return;
    if (shouldEnableAnalysisMode && !context.analysisMode) {
      context.setAnalysisMode(true);
    }
  }, [shouldEnableAnalysisMode, context]);

  const { setHiddenNames: _setHiddenNames, setAllNames, fetchNames } =
    useNameManagementCallbacks(context);

  const { handleToggleVisibility, handleDelete } = useProfile(activeUser, {
    showSuccess,
    showError,
    fetchNames,
    setAllNames,
  });

  React.useEffect(() => {
    if (!context) return;
    handlersRef.current.handleToggleVisibility = handleToggleVisibility;
    handlersRef.current.handleDelete = handleDelete;
  }, [context, handleToggleVisibility, handleDelete, handlersRef]);

  if (!context) {
    return null;
  }

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
  isAdmin = false,
  activeUser,
  onNameHidden,
}) {
  // * Only render if stats are available
  if (!stats) return null;

  return (
    <AnalysisDashboard
      stats={stats}
      selectionStats={selectionStats}
      highlights={propsHighlights}
      isAdmin={isAdmin}
      userName={activeUser}
      onNameHidden={onNameHidden}
    />
  );
}

AnalysisDashboardWrapper.propTypes = {
  stats: PropTypes.object,
  selectionStats: PropTypes.object,
  highlights: PropTypes.object,
  isAdmin: PropTypes.bool,
  activeUser: PropTypes.string,
  onNameHidden: PropTypes.func,
};

// * Wrapper component factory to pass props to AnalysisDashboardWrapper
// * This creates a component function that can use hooks properly
const createAnalysisDashboardWrapper = (
  stats,
  selectionStats,
  isAdmin,
  activeUser,
  onNameHidden,
) => {
  return function AnalysisDashboardWrapperWithProps() {
    // * Get context inside the component - it's available here because this component
    // * is rendered inside NameManagementView's context provider
    const context = useNameManagementContextSafe();
    const handleNameHidden =
      onNameHidden ||
      (() => {
        context?.refetch();
      });
    return (
      <AnalysisDashboardWrapper
        stats={stats}
        selectionStats={selectionStats}
        isAdmin={isAdmin}
        activeUser={activeUser}
        onNameHidden={handleNameHidden}
      />
    );
  };
};

function AnalysisBulkActionsWrapper({
  activeUser,
  canManageActiveUser,
  isAdmin,
  fetchSelectionStats: _fetchSelectionStats,
  showSuccess,
  showError,
  showToast: _showToast,
}) {
  const context = useNameManagementContextSafe();

  const selectedCount = context?.selectedCount ?? 0;
  const selectedNamesValue = context?.selectedNames;
  // * Keep both Set format for selection logic and original array for bulk operations
  const selectedNamesSet = useMemo(
    () => selectedNamesToSet(selectedNamesValue),
    [selectedNamesValue],
  );

  // * Extract name IDs from selectedNames, handling different formats
  const selectedNamesArray = useMemo(
    () => extractNameIds(selectedNamesValue),
    [selectedNamesValue],
  );

  const { setHiddenNames: _setHiddenNames, setAllNames, fetchNames } =
    useNameManagementCallbacks(context);

  const { handleBulkHide, handleBulkUnhide } = useProfile(activeUser, {
    showSuccess,
    showError,
    fetchNames,
    setAllNames,
  });

  const contextNames = context?.names;
  const contextFilterStatus = context?.filterStatus;

  const filteredAndSortedNames = useMemo(() => {
    if (!contextNames || contextNames.length === 0) return [];
    let filtered = [...contextNames];

    // Use shared isNameHidden utility for consistent visibility check
    if (contextFilterStatus === "visible") {
      filtered = filtered.filter((name) => !isNameHidden(name));
    } else if (contextFilterStatus === "hidden") {
      filtered = filtered.filter((name) => isNameHidden(name));
    }
    // * "all" shows everything (no filtering)

    return filtered;
  }, [contextNames, contextFilterStatus]);

  const allVisibleSelected =
    filteredAndSortedNames.length > 0 &&
    filteredAndSortedNames.every((name) => selectedNamesSet.has(name.id));

  const handleSelectAll = useCallback(() => {
    const visibleNameIds = filteredAndSortedNames.map((name) => name.id);
    if (visibleNameIds.length === 0) {
      return;
    }
    const shouldSelect = !allVisibleSelected;
    if (context?.toggleNamesByIds) {
      context.toggleNamesByIds(visibleNameIds, shouldSelect);
      return;
    }
    visibleNameIds.forEach((id) => {
      context?.toggleNameById?.(id, shouldSelect);
    });
  }, [allVisibleSelected, filteredAndSortedNames, context]);

  const handleExport = useCallback(() => {
    exportTournamentResultsToCSV(
      filteredAndSortedNames,
      "naming_nosferatu_export",
    );
  }, [filteredAndSortedNames]);

  if (!context || !canManageActiveUser || filteredAndSortedNames.length === 0) {
    return null;
  }

  return (
    <AnalysisBulkActions
      selectedCount={selectedCount}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleSelectAll}
      onBulkHide={() => {
        devLog("[TournamentSetup] onBulkHide called", {
          selectedCount,
          selectedNamesArrayLength: selectedNamesArray.length,
          selectedNamesArray,
          contextSelectedNames: context.selectedNames,
        });

        if (selectedNamesArray.length === 0) {
          devWarn(
            "[TournamentSetup] No names in selectedNamesArray despite selectedCount:",
            selectedCount,
          );
          showError("No names selected");
          return;
        }

        try {
          handleBulkHide(selectedNamesArray);
        } catch (error) {
          devError("[TournamentSetup] Error calling handleBulkHide:", error);
          showError(
            `Failed to hide names: ${error.message || "Unknown error"}`,
          );
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
  analysisHandlersProps,
}) {
  const context = useNameManagementContextSafe();

  // * Return null if context is not available (component not within NameManagementView)
  if (!context) {
    return null;
  }

  // * Admin features only available in analysis mode
  const showAdminFeatures = context.analysisMode && canManageActiveUser;

  return (
    <div
      className={styles.stickyControls}
      data-component="tournament-name-grid"
      data-testid="tournament-name-grid-container"
      role="region"
      aria-label="Tournament name selection controls"
    >
      {/* * Render AnalysisHandlersProvider inside context */}
      {analysisHandlersProps && (
        <AnalysisHandlersProvider {...analysisHandlersProps} />
      )}
      <NameSelection
        selectedNames={context.selectedNames}
        availableNames={context.names}
        onToggleName={context.toggleName}
        onStartTournament={context.onStartTournament}
        isAdmin={showAdminFeatures && isAdmin}
        selectedCategory={context.selectedCategory}
        searchTerm={context.searchTerm}
        sortBy={context.sortBy}
        filterStatus={
          showAdminFeatures
            ? context.filterStatus
            : FILTER_OPTIONS.VISIBILITY.VISIBLE
        }
        isSwipeMode={context.isSwipeMode}
        onToggleSwipeMode={() => context.setIsSwipeMode(!context.isSwipeMode)}
        showCatPictures={context.showCatPictures}
        onToggleCatPictures={() =>
          context.setShowCatPictures(!context.showCatPictures)
        }
        imageList={galleryImages}
        SwipeableCards={SwipeableNameCards}
        showSelectedOnly={context.showSelectedOnly}
        onToggleShowSelected={() =>
          context.setShowSelectedOnly(!context.showSelectedOnly)
        }
        analysisMode={context.analysisMode}
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
  analysisHandlersProps: PropTypes.object,
};

function TournamentSetupContent({
  onStart,
  userName,
  enableAnalysisMode = false,
  onOpenSuggestName,
}) {
  // * Get current view from store
  const currentView = useAppStore((state) => state.tournament.currentView);

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
  const { isAdmin } = useAdminStatus(userName);

  // * Profile hook for analysis mode
  const { showSuccess, showError, showToast, ToastContainer } =
    useProfileNotifications();

  const {
    isAdmin: profileIsAdmin,
    activeUser,
    canManageActiveUser,
    userOptions,
    userFilter,
    setUserFilter,
    stats,
    selectionStats,
    fetchSelectionStats,
  } = useProfile(userName, {
    showSuccess,
    showError,
  });

  // * Check URL for analysis mode parameter
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
      if (!galleryImages || !Array.isArray(galleryImages)) return;
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
    if (
      !lightboxOpen ||
      !galleryImages ||
      !Array.isArray(galleryImages) ||
      galleryImages.length === 0
    )
      return [];
    const preload = [];
    const prevIndex =
      lightboxIndex === 0 ? galleryImages.length - 1 : lightboxIndex - 1;
    const nextIndex =
      lightboxIndex === galleryImages.length - 1 ? 0 : lightboxIndex + 1;
    if (galleryImages[prevIndex]) preload.push(galleryImages[prevIndex]);
    if (galleryImages[nextIndex]) preload.push(galleryImages[nextIndex]);
    return preload;
  }, [lightboxOpen, lightboxIndex, galleryImages]);

  const photoGalleryProps = useMemo(
    () => ({
      galleryImages,
      showAllPhotos,
      onShowAllPhotosToggle: () => setShowAllPhotos((v) => !v),
      onImageOpen: handleImageOpen,
      isAdmin,
      userName,
      onImagesUploaded: handleImagesUploaded,
    }),
    [
      galleryImages,
      showAllPhotos,
      handleImageOpen,
      isAdmin,
      userName,
      handleImagesUploaded,
    ],
  );

  const lightboxElement = lightboxOpen &&
    galleryImages &&
    Array.isArray(galleryImages) &&
    galleryImages.length > 0 && (
      <Lightbox
        images={galleryImages}
        currentIndex={lightboxIndex}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
        preloadImages={preloadImages}
      />
    );

  if (currentView === "photos") {
    return (
      <>
        <ToastContainer />
        <div className={`${styles.container} ${styles.photosViewContainer}`}>
          <div className={styles.photosViewContent}>
            <h2 className={styles.photosViewTitle}>Photo Gallery</h2>
            <p className={styles.photosViewSubtitle}>
              Click any photo to view full size
            </p>
            <PhotoGallery {...photoGalleryProps} />
          </div>
        </div>
        {lightboxElement}
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.container}>
        <NameManagementView
          mode="tournament"
          userName={userName}
          onStartTournament={onStart}
          onOpenSuggestName={onOpenSuggestName}
          tournamentProps={{
            SwipeableCards: SwipeableNameCards,
            isAdmin,
            imageList: galleryImages,
            gridClassName: styles.cardsContainer,
          }}
          profileProps={{
            isAdmin: canManageActiveUser,
            showUserFilter: profileIsAdmin,
            userOptions,
            userFilter,
            setUserFilter,
            stats,
            selectionStats,
            onToggleVisibility: (nameId) =>
              handlersRef.current.handleToggleVisibility?.(nameId),
            onDelete: (name) => handlersRef.current.handleDelete?.(name),
          }}
          extensions={{
            dashboard: createAnalysisDashboardWrapper(
              stats,
              selectionStats,
              isAdmin,
              activeUser,
              undefined, // * Will use context.refetch() inside the wrapper component
            ),
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
            nameGrid: () => (
              <TournamentNameGrid
                isAdmin={isAdmin}
                galleryImages={galleryImages}
                canManageActiveUser={canManageActiveUser}
                onToggleVisibility={(nameId) =>
                  handlersRef.current.handleToggleVisibility?.(nameId)
                }
                onDelete={(name) => handlersRef.current.handleDelete?.(name)}
                analysisHandlersProps={{
                  shouldEnableAnalysisMode,
                  activeUser,
                  canManageActiveUser,
                  handlersRef,
                  fetchSelectionStats,
                  showSuccess,
                  showError,
                  showToast,
                }}
              />
            ),
          }}
        />
        {lightboxElement}
      </div>
    </>
  );
}

TournamentSetupContent.propTypes = {
  onStart: PropTypes.func.isRequired,
  userName: PropTypes.string,
  enableAnalysisMode: PropTypes.bool,
  onOpenSuggestName: PropTypes.func,
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
  onOpenSuggestName: PropTypes.func,
};

export default TournamentSetup;
