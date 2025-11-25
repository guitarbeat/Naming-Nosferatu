/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Thin wrapper around NameManagementView with tournament-specific layout and extensions.
 */
import { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  NameManagementView,
  useNameManagementContext,
  Error,
} from "../../shared/components";
import { useImageGallery, useAdminStatus, useCategoryFilters } from "./hooks";
import {
  NameSelection,
  SwipeableNameCards,
  TournamentSidebar,
  Lightbox,
  NameSuggestionSection,
} from "./components";
import styles from "./TournamentSetup.module.css";

// * Error boundary component
const ErrorBoundary = Error;

function TournamentSetupContent({ onStart, userName }) {
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

  // * Tournament-specific component that uses NameManagementView context
  function TournamentNameGrid() {
    const context = useNameManagementContext();
    const categories = useCategoryFilters(context.names);

    return (
      <div className={styles.stickyControls}>
        <NameSelection
          selectedNames={context.selectedNames}
          availableNames={context.names}
          onToggleName={context.toggleName}
          isAdmin={isAdmin}
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
          extensions={{
            nameGrid: <TournamentNameGrid />,
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
};

export default TournamentSetup;
