/**
 * @module TournamentSetup
 * @description Tournament setup wizard for selecting cat names and starting a tournament.
 * Refactored for better maintainability with extracted components and hooks.
 */
import { useState } from "react";
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

  const { galleryImages, setGalleryImages } = useImageGallery();
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

  // * Lightbox handlers
  const handleImageOpen = (image) => {
    const idx = galleryImages.indexOf(image);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const handleImagesUploaded = (uploaded) => {
    setGalleryImages((prev) => [...uploaded, ...prev]);
  };

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
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
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
