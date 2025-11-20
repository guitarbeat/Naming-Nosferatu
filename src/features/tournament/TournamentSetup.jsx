/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Refactored for better maintainability with extracted components and hooks.
 */
import { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Loading, Error } from "../../shared/components";
import {
  useTournamentSetup,
  useImageGallery,
  useAdminStatus,
  useCategoryFilters,
} from "./hooks";
import {
  NameSelection,
  SwipeableNameCards,
  TournamentHeader,
  TournamentSidebar,
  StartButton,
  Lightbox,
} from "./components";
import styles from "./TournamentSetup.module.css";

// * Import Error components for specific use cases
const ErrorDisplay = Error;
const ErrorBoundary = Error;

function TournamentSetupContent({ onStart, userName }) {
  // * Custom hooks for state management
  const {
    availableNames,
    selectedNames,
    isLoading,
    errors,
    isError,
    clearErrors,
    clearError,
    toggleName,
    handleSelectAll,
  } = useTournamentSetup(userName);

  const {
    galleryImages,
    addImages,
    isLoading: _imagesLoading,
    imageMap,
  } = useImageGallery();
  const isAdmin = useAdminStatus(userName);
  const categories = useCategoryFilters(availableNames);

  // * UI state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showCatPictures, setShowCatPictures] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // * Lightbox handlers - optimized with useCallback and imageMap
  const handleImageOpen = useCallback(
    (image) => {
      // * Validate image parameter before opening lightbox
      if (!image || typeof image !== "string") {
        console.warn("handleImageOpen called with invalid image:", image);
        return;
      }

      // * Ensure image exists in galleryImages
      if (!galleryImages || galleryImages.length === 0) {
        console.warn("Cannot open lightbox: no gallery images available");
        return;
      }

      // * Find index in galleryImages array (more reliable than imageMap)
      const idx = galleryImages.indexOf(image);
      if (idx === -1) {
        console.warn("Image not found in gallery:", image);
        return;
      }

      setLightboxIndex(idx);
      setLightboxOpen(true);
    },
    [imageMap, galleryImages]
  );

  const handleImagesUploaded = useCallback(
    (uploaded) => {
      addImages(uploaded);
    },
    [addImages]
  );

  // Memoize lightbox navigation to prevent unnecessary re-renders
  const handleLightboxNavigate = useCallback((newIndex) => {
    setLightboxIndex(newIndex);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Preload adjacent images for smoother lightbox navigation
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

  // * Loading state
  if (isLoading) {
    return <Loading variant="spinner" />;
  }

  // * Error state
  if (isError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Error Loading Names</h2>
          <ErrorDisplay
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

  // * Empty state
  if (availableNames.length === 0) {
    return (
      <div className={styles.container}>
        <h2>No Names Available</h2>
        <p className={styles.errorMessage}>
          There are no names available for the tournament at this time.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Selection Panel */}
      <div className={styles.selectionPanel}>
        <TournamentHeader
          selectedNames={selectedNames}
          availableNames={availableNames}
          onSelectAll={handleSelectAll}
          isSwipeMode={isSwipeMode}
          onSwipeModeToggle={() => setIsSwipeMode(!isSwipeMode)}
          showCatPictures={showCatPictures}
          onCatPicturesToggle={() => setShowCatPictures(!showCatPictures)}
          onStart={onStart}
          isAdmin={isAdmin}
        />

        {/* Tournament Info - Integrated */}
        <div className={styles.tournamentInfoIntegrated}>
          <h1 className={styles.tournamentTitle}>🏆 Cat Name Tournament</h1>
          <p className={styles.tournamentSubtitle}>
            Pick the perfect name for your cat through fun head-to-head battles!
          </p>
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.max((selectedNames.length / Math.max(availableNames.length, 1)) * 100, 5)}%`,
                }}
              />
            </div>
            <span className={styles.progressText}>
              {selectedNames.length} of {availableNames.length} names selected
            </span>
          </div>
        </div>

        <NameSelection
          selectedNames={selectedNames}
          availableNames={availableNames}
          onToggleName={toggleName}
          isAdmin={isAdmin}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isSwipeMode={isSwipeMode}
          showCatPictures={showCatPictures}
          imageList={galleryImages}
          SwipeableCards={SwipeableNameCards}
        />

        {selectedNames.length >= 2 && (
          <div className={styles.startSection}>
            <StartButton selectedNames={selectedNames} onStart={onStart} />
          </div>
        )}
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
