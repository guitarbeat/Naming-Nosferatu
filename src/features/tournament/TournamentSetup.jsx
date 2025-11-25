/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Thin wrapper around NameManagementView with tournament-specific layout and extensions.
 */
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import {
  NameManagementView,
  useNameManagementContext,
  Error,
} from "../../shared/components";
import { useRouting } from "@hooks/useRouting";
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
import ProfileDashboard from "../../shared/components/ProfileDashboard/ProfileDashboard";
import { ProfileBulkActions } from "../profile/components/ProfileBulkActions";
import styles from "./TournamentSetup.module.css";

// * Error boundary component
const ErrorBoundary = Error;

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
    userFilter,
    setUserFilter,
    canManageActiveUser,
    userSelectOptions,
    userListLoading,
    userListError,
  } = useProfileUser(userName);
  const { stats, statsLoading, selectionStats, fetchSelectionStats } =
    useProfileStats(activeUser);

  // * Check URL for analysis mode parameter
  const { currentRoute } = useRouting();
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const shouldEnableAnalysisMode =
    enableAnalysisMode || urlParams.get("analysis") === "true";

  // * Create handlers ref that will be populated by a component inside context
  const handlersRef = React.useRef({
    handleToggleVisibility: null,
    handleDelete: null,
  });

  // * Component that creates handlers inside context and initializes analysis mode
  function AnalysisHandlersProvider() {
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
      [context]
    );

    const setAllNames = useCallback(
      (updater) => {
        context.setNames(updater);
      },
      [context]
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
      showToast
    );

    React.useEffect(() => {
      handlersRef.current.handleToggleVisibility = handleToggleVisibility;
      handlersRef.current.handleDelete = handleDelete;
    }, [handleToggleVisibility, handleDelete]);

    return null;
  }

  // * Analysis Mode components that use NameManagementView context
  function AnalysisDashboard() {
    const context = useNameManagementContext();

    // * Only show dashboard when analysis mode is active
    if (!context.analysisMode) return null;

    const highlights = useProfileHighlights(context.names);

    if (!stats) return null;

    return (
      <ProfileDashboard
        stats={stats}
        selectionStats={selectionStats}
        highlights={highlights}
      />
    );
  }

  function AnalysisBulkActions() {
    const context = useNameManagementContext();

    // * Only show bulk actions when analysis mode is active
    if (!context.analysisMode) return null;

    const selectedCount = context.selectedCount;
    // * Ensure selectedNames is a Set (handle case where it might be an array or undefined)
    const selectedNames =
      context.selectedNames instanceof Set
        ? context.selectedNames
        : new Set(
            Array.isArray(context.selectedNames) ? context.selectedNames : []
          );

    const setHiddenNames = useCallback(
      (updater) => {
        context.setHiddenIds(updater);
      },
      [context]
    );

    const setAllNames = useCallback(
      (updater) => {
        context.setNames(updater);
      },
      [context]
    );

    const fetchNames = useCallback(() => {
      context.refetch();
    }, [context]);

    const { handleBulkHide, handleBulkUnhide } = useProfileNameOperations(
      nameOperationsRef.activeUser,
      nameOperationsRef.canManageActiveUser,
      context.hiddenIds,
      setHiddenNames,
      setAllNames,
      fetchNames,
      nameOperationsRef.fetchSelectionStats,
      nameOperationsRef.showSuccess,
      nameOperationsRef.showError,
      nameOperationsRef.showToast
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
      <ProfileBulkActions
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

  // * Tournament-specific component that uses NameManagementView context
  function TournamentNameGrid() {
    const context = useNameManagementContext();
    const categories = useCategoryFilters(context.names);

    // * Admin features only available in analysis mode
    const showAdminFeatures = context.analysisMode && canManageActiveUser;

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

  // * Lightbox handlers
  const handleImageOpen = useCallback(
    (image) => {
      const idx = galleryImages.indexOf(image);
      if (idx !== -1) {
        setLightboxIndex(idx);
        setLightboxOpen(true);
      }
    },
    [galleryImages]
  );

  const handleImagesUploaded = useCallback(
    (uploaded) => {
      addImages(uploaded);
    },
    [addImages]
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

  // * Name operations for analysis mode - will be used inside context-aware components
  const nameOperationsRef = useMemo(
    () => ({
      activeUser,
      canManageActiveUser,
      fetchSelectionStats,
      showSuccess,
      showError,
      showToast,
    }),
    [
      activeUser,
      canManageActiveUser,
      fetchSelectionStats,
      showSuccess,
      showError,
      showToast,
    ]
  );

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
            dashboard: <AnalysisDashboard />,
            bulkActions: <AnalysisBulkActions />,
            nameGrid: (
              <>
                <AnalysisHandlersProvider />
                <TournamentNameGrid />
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
