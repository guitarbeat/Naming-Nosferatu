/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Thin wrapper around NameManagementView with tournament-specific layout and extensions.
 */
import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  NameManagementView,
} from "../../shared/components/NameManagementView/NameManagementView";
import Error from "../../shared/components/Error/Error";
import { useImageGallery } from "./hooks/useImageGallery";
import { useAdminStatus } from "../../shared/hooks/useAppHooks";
import SwipeableNameCards from "./components/SwipeMode/SwipeableNameCards";
import Lightbox from "./components/Lightbox";
import { PhotoGallery } from "./components/TournamentSidebar/PhotoComponents";
import { useProfileNotifications } from "../profile/hooks/useProfileNotifications";
import { useProfile } from "../profile/hooks/useProfile";
import useAppStore from "../../core/store/useAppStore";
import styles from "./TournamentSetup.module.css";
import identityStyles from "./TournamentSetupIdentity.module.css";
import { AnalysisHandlersProvider, createAnalysisDashboardWrapper } from "./components/AnalysisWrappers";
import { AnalysisBulkActionsWrapper } from "./components/AnalysisBulkActionsWrapper";

// * Error boundary component
const ErrorBoundary = Error;

interface TournamentSetupProps {
  onStart: (selectedNames: unknown) => void;
  userName?: string;
  enableAnalysisMode?: boolean;
  onOpenSuggestName?: () => void;
  onNameChange?: (name: string) => void;
}

function TournamentSetupContent({
  onStart,
  userName = "",
  enableAnalysisMode = false,
  onOpenSuggestName,
  onNameChange,
}: TournamentSetupProps) {
  // * Get current view from store
  const currentView = useAppStore((state) => state.tournament.currentView);

  // * Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // * Sync temp name when userName prop changes
  React.useEffect(() => {
    setTempName(userName);
  }, [userName]);

  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tempName.trim()) {
      onNameChange?.(tempName.trim());
      setIsEditingName(false);
    }
  };

  // * Tournament-specific UI state (not managed by NameManagementView)
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const {
    galleryImages,
    addImages,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLoading: _imagesLoading,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlersRef = useRef<{
    handleToggleVisibility: ((nameId: string | number) => void) | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleDelete: ((name: any) => void) | null;
  }>({
    handleToggleVisibility: null,
    handleDelete: null,
  });

  // * Lightbox handlers
  const handleImageOpen = useCallback(
    (image: string) => {
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
    (uploaded: string[]) => {
      addImages(uploaded);
    },
    [addImages],
  );

  const handleLightboxNavigate = useCallback((newIndex: number) => {
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
      galleryImages: galleryImages || [],
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
        {/* Name Identity Section */}
        <div className={identityStyles.identitySection}>
          <div className={identityStyles.identityLabel}>OPERATOR IDENTITY:</div>
          {isEditingName ? (
            <form onSubmit={handleNameSubmit} className={identityStyles.identityForm}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className={identityStyles.identityInput}
                autoFocus
                onBlur={() => {
                  // Optional: Cancel on blur if empty or desired
                  // setIsEditingName(false);
                }}
              />
              <button type="submit" className={identityStyles.identitySaveBtn}>✓</button>
            </form>
          ) : (
            <div className={identityStyles.identityDisplay}>
              <span className={identityStyles.identityName}>{userName}</span>
              <button 
                className={identityStyles.identityEditBtn} 
                onClick={() => setIsEditingName(true)}
                aria-label="Change Name"
              >
                [ EDIT ]
              </button>
            </div>
          )}
        </div>

        <NameManagementView
          mode="tournament"
          userName={userName}
          onStartTournament={onStart}
          onOpenSuggestName={onOpenSuggestName}
          tournamentProps={{
            SwipeableCards: SwipeableNameCards,
            isAdmin,
            imageList: galleryImages || [],
            gridClassName: styles.cardsContainer,
          }}
          profileProps={{
            isAdmin: canManageActiveUser,
            showUserFilter: profileIsAdmin,
            userOptions: userOptions ?? undefined,
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
            bulkActions: (props: { onExport?: () => void }) => (
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
            contextLogic: () => (
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
            ),
          }}
        />
        {lightboxElement}
      </div>
    </>
  );
}

function TournamentSetup(props: TournamentSetupProps) {
  return (
    <ErrorBoundary variant="boundary">
      <TournamentSetupContent {...props} />
    </ErrorBoundary>
  );
}

TournamentSetup.displayName = "TournamentSetup";

export default TournamentSetup;
