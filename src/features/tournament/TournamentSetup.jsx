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
  TournamentSidebar,
  StartButton,
  Lightbox,
  NameSuggestionSection,
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

  // * UI state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showCatPictures, setShowCatPictures] = useState(false);
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
  const categories = useCategoryFilters(availableNames);

  // * Lightbox handlers - optimized with useCallback
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
        {/* Tournament Header */}
        <div className={styles.tournamentHeaderTop}>
          <div className={styles.tournamentTitleSection}>
            <h1 className={styles.tournamentTitle}>🏆 Cat Name Tournament</h1>
            <p className={styles.tournamentSubtitle}>
              Pick the perfect name for your cat through fun head-to-head
              battles!
            </p>
          </div>
          <div className={styles.headerActions}>
            {isAdmin && (
              <button
                className={styles.selectAllButton}
                onClick={handleSelectAll}
                type="button"
                aria-label={
                  selectedNames.length === availableNames.length
                    ? "Clear all selections"
                    : "Select all names"
                }
              >
                {selectedNames.length === availableNames.length
                  ? "✨ Start Fresh"
                  : "🎲 Select All"}
              </button>
            )}

            <button
              onClick={() => setIsSwipeMode(!isSwipeMode)}
              className={`${styles.headerActionButton} ${styles.swipeModeToggleButton} ${
                isSwipeMode ? styles.headerActionButtonActive : ""
              }`}
              type="button"
              aria-label={
                isSwipeMode ? "Switch to card mode" : "Switch to swipe mode"
              }
            >
              {isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
            </button>

            <button
              onClick={() => setShowCatPictures(!showCatPictures)}
              className={`${styles.headerActionButton} ${styles.catPicturesToggleButton} ${
                showCatPictures ? styles.headerActionButtonActive : ""
              }`}
              type="button"
              aria-label={
                showCatPictures
                  ? "Hide cat pictures"
                  : "Show cat pictures on cards"
              }
              title="Add random cat pictures to make it more like Tinder! 🐱"
            >
              {showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
            </button>

            {selectedNames.length >= 2 && (
              <StartButton
                selectedNames={selectedNames}
                onStart={onStart}
                variant="header"
              />
            )}
          </div>
        </div>
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

        {/* Name Suggestion Section - at bottom for wider layout */}
        <div className={styles.nameSuggestionWrapper}>
          <NameSuggestionSection />
        </div>
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
