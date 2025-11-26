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
import { useImageGallery, useAdminStatus, useCategoryFilters } from "./hooks";
import {
  NameSelection,
  SwipeableNameCards,
  TournamentSidebar,
  Lightbox,
  NameSuggestionSection,
} from "./components";
import { useProfileStats } from "../profile/hooks/useProfileStats";
import { useProfileHighlights } from "../profile/hooks/useProfileHighlights";
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

// * Analysis Mode components that use NameManagementView context
function AnalysisDashboardWrapper({ stats, selectionStats }) {
  const context = useNameManagementContext();

  const highlights = useProfileHighlights(context.names);

  if (!context.analysisMode || !stats) return null;

  return (
    <AnalysisDashboard
      stats={stats}
      selectionStats={selectionStats}
      highlights={highlights}
    />
  );
}

AnalysisDashboardWrapper.propTypes = {
  stats: PropTypes.object,
  selectionStats: PropTypes.object,
};

function AnalysisBulkActionsWrapper({
  activeUser,
  canManageActiveUser,
  fetchSelectionStats,
  showSuccess,
  showError,
  showToast,
}) {
  const context = useNameManagementContext();

  const { selectedCount } = context;
  // * Ensure selectedNames is a Set (handle case where it might be an array or undefined)
  const selectedNames =
    context.selectedNames instanceof Set
      ? context.selectedNames
      : new Set(
          Array.isArray(context.selectedNames) ? context.selectedNames : [],
        );

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
    const isNameHidden = (n) =>
      Boolean(n.isHidden) ||
      (context.hiddenIds instanceof Set && context.hiddenIds.has(n.id));

    if (context.filterStatus === "active") {
      filtered = filtered.filter((name) => !isNameHidden(name));
    } else if (context.filterStatus === "hidden") {
      filtered = filtered.filter((name) => isNameHidden(name));
    }

    return filtered;
  }, [context.names, context.hiddenIds, context.filterStatus]);

  const allVisibleSelected =
    filteredAndSortedNames.length > 0 &&
    filteredAndSortedNames.every((name) => selectedNames.has(name.id));

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

  if (!canManageActiveUser || filteredAndSortedNames.length === 0) {
    return null;
  }

  return (
    <AnalysisBulkActions
      selectedCount={selectedCount}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleSelectAll}
      onBulkHide={() => handleBulkHide(Array.from(selectedNames))}
      onBulkUnhide={() => handleBulkUnhide(Array.from(selectedNames))}
      isAllSelected={allVisibleSelected}
      showActions={true}
    />
  );
}

AnalysisBulkActionsWrapper.propTypes = {
  activeUser: PropTypes.string,
  canManageActiveUser: PropTypes.bool,
  fetchSelectionStats: PropTypes.func,
  showSuccess: PropTypes.func,
  showError: PropTypes.func,
  showToast: PropTypes.func,
};

// * Tournament-specific component that uses NameManagementView context
function TournamentNameGrid({ isAdmin, galleryImages, canManageActiveUser }) {
  const context = useNameManagementContext();
  const categories = useCategoryFilters(context.names);

  // * Admin features only available in analysis mode
  const showAdminFeatures = context.analysisMode && canManageActiveUser;

  // Helper to check if user can manage (needs context access)
  // We can't access canManageActiveUser directly here easily without passing it down
  // But we know isAdmin is passed as prop.
  // Let's rely on the prop passed in.

  return (
    <div className={styles.stickyControls}>
      <NameSelection
        selectedNames={context.selectedNames}
        availableNames={context.names}
        onToggleName={context.toggleName}
        isAdmin={showAdminFeatures ? isAdmin : false}
        categories={categories}
        selectedCategory={context.selectedCategory}
        onCategoryChange={context.setSelectedCategory}
        searchTerm={context.searchTerm}
        onSearchChange={context.setSearchTerm}
        sortBy={context.sortBy}
        onSortChange={context.setSortBy}
        isSwipeMode={context.isSwipeMode}
        showCatPictures={context.showCatPictures}
        imageList={galleryImages}
        SwipeableCards={SwipeableNameCards}
        showSelectedOnly={context.showSelectedOnly}
      />
    </div>
  );
}

TournamentNameGrid.propTypes = {
  isAdmin: PropTypes.bool,
  galleryImages: PropTypes.array,
  canManageActiveUser: PropTypes.bool,
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
  const { showSuccess, showError, showToast } = useProfileNotifications();
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
            hiddenIds: undefined, // Will come from context
          }}
          extensions={{
            dashboard: (
              <AnalysisDashboardWrapper
                stats={stats}
                selectionStats={selectionStats}
              />
            ),
            bulkActions: (
              <AnalysisBulkActionsWrapper
                activeUser={activeUser}
                canManageActiveUser={canManageActiveUser}
                fetchSelectionStats={fetchSelectionStats}
                showSuccess={showSuccess}
                showError={showError}
                showToast={showToast}
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
