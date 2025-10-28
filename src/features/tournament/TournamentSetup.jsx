/**
 * @module TournamentSetup
 * @description Simple wizard for selecting cat names and starting a tournament.
 * Shows names and descriptions by default. Admin users get advanced filtering options.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import { resolveSupabaseClient } from "../../integrations/supabase/client";
import {
  getNamesWithDescriptions,
  tournamentsAPI,
  imagesAPI,
} from "../../integrations/supabase/api";
import { compressImageFile, devLog } from "../../shared/utils/coreUtils";
import {
  Card,
  Loading,
  NameCard,
  Error,
  Input,
  Select,
  CatImage,
} from "../../shared/components";
import useToast from "../../core/hooks/useToast";
import useAppStore from "../../core/store/useAppStore";
import useMobileGestures from "../../core/hooks/useMobileGestures";
import { validateCatName } from "../../shared/utils/validationUtils";
import { isUserAdmin } from "../../shared/utils/authUtils";
import {
  CAT_IMAGES,
  GALLERY_IMAGE_SIZES,
  DEFAULT_DESCRIPTION,
  FALLBACK_NAMES,
  SORT_OPTIONS,
} from "./constants";
import {
  getRandomCatImage,
  validateNameObjects,
  deduplicateImages,
  filterAndSortNames,
  generateCategoryOptions,
  extractCategories,
} from "./utils";
import {
  Lightbox,
  NameSuggestionSection,
  StartButton,
} from "./components";
import styles from "./TournamentSetup.module.css";

// * Import Error components for specific use cases
const ErrorDisplay = Error;
const ErrorBoundary = Error;

// Simple name selection - names and descriptions only
const NameSelection = ({
  selectedNames,
  availableNames,
  onToggleName,
  isAdmin,
  // Admin-only props
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  isSwipeMode,
  showCatPictures,
  imageList,
}) => {
  // * For non-admin users, just show all names. For admins, filter and sort
  const displayNames = isAdmin
    ? filterAndSortNames(availableNames, {
        category: selectedCategory,
        searchTerm,
        sortBy,
      })
    : availableNames;

  const categoryOptions = useMemo(
    () => generateCategoryOptions(categories, availableNames),
    [categories, availableNames]
  );

  return (
    <div className={styles.nameSelection}>
      {/* Swipe Mode Instructions */}
      {isSwipeMode && (
        <div className={styles.swipeModeInstructions}>
          <span>
            👈 Swipe left to remove • 👉 Swipe right to select for tournament
          </span>
        </div>
      )}

      {/* Admin-only filtering and sorting controls */}
      {isAdmin && (
        <div className={styles.controlsSection}>
          {/* Category filter */}
          {categoryOptions.length > 0 && (
            <div className={styles.filterGroup}>
              <Select
                name="category"
                label="Category"
                value={selectedCategory ?? ""}
                onChange={(e) => onCategoryChange(e.target.value || null)}
                options={categoryOptions}
                className={styles.filterSelect}
                placeholder=""
              />
            </div>
          )}

          {/* Search filter */}
          <div className={styles.filterGroup}>
            <Input
              name="search-filter"
              label="Search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search names or descriptions..."
              className={styles.searchInput}
              type="text"
            />
          </div>

          {/* Sort options */}
          <div className={styles.filterGroup}>
            <Select
              name="sort-filter"
              label="Sort by"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              options={SORT_OPTIONS}
              className={styles.filterSelect}
              placeholder=""
            />
          </div>
        </div>
      )}

      {/* Admin-only results count */}
      {isAdmin && (
        <div className={styles.resultsInfo}>
          <span className={styles.resultsCount}>
            Showing {displayNames.length} of {availableNames.length} names
            {selectedCategory && ` in "${selectedCategory}" category`}
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>
      )}

      <div className={styles.cardsContainer}>
        {isSwipeMode ? (
          <SwipeableNameCards
            names={displayNames}
            selectedNames={selectedNames}
            onToggleName={onToggleName}
            isAdmin={isAdmin}
            showCatPictures={showCatPictures}
            imageList={imageList}
          />
        ) : (
          displayNames.map((nameObj) => (
            <NameCard
              key={nameObj.id}
              name={nameObj.name}
              description={nameObj.description || DEFAULT_DESCRIPTION}
              isSelected={selectedNames.some((n) => n.id === nameObj.id)}
              onClick={() => onToggleName(nameObj)}
              size="small"
              // Cat picture when enabled
              image={
                showCatPictures
                  ? getRandomCatImage(nameObj.id, imageList)
                  : undefined
              }
              // Admin-only metadata display
              metadata={
                isAdmin
                  ? {
                      rating: nameObj.avg_rating,
                      popularity: nameObj.popularity_score,
                      tournaments: nameObj.total_tournaments,
                      categories: nameObj.categories,
                    }
                  : undefined
              }
            />
          ))
        )}
      </div>

      {isAdmin && displayNames.length === 0 && (
        <div className={styles.noResults}>
          <p>😿 No names found matching your criteria</p>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};

// Swipeable Name Cards Component
const SwipeableNameCards = ({
  names,
  selectedNames,
  onToggleName,
  isAdmin,
  showCatPictures = false,
  imageList = CAT_IMAGES,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const currentName = names[currentIndex];
  const isSelected = selectedNames.some((n) => n.id === currentName?.id);
  const imageSrc =
    showCatPictures && currentName
      ? getRandomCatImage(currentName.id, imageList)
      : null;

  // Enhanced mobile gestures
  const { elementRef: gestureRef, addHapticFeedback } = useMobileGestures({
    enableSwipe: true,
    enableLongPress: true,
    enableDoubleTap: true,
    onSwipe: (data) => {
      const { direction, distance } = data;
      if (distance > 100) {
        if (direction === "right") {
          // Swipe right = select
          if (!isSelected) {
            onToggleName(currentName);
            addHapticFeedback("success");
          }
        } else if (direction === "left") {
          // Swipe left = deselect
          if (isSelected) {
            onToggleName(currentName);
            addHapticFeedback("light");
          }
        }
        // Move to next card
        if (currentIndex < names.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    },
    onLongPress: () => {
      setIsLongPressing(true);
      addHapticFeedback("heavy");
      // Show additional info or context menu
      setTimeout(() => setIsLongPressing(false), 1000);
    },
    onDoubleTap: () => {
      // Double tap to toggle selection
      onToggleName(currentName);
      addHapticFeedback("success");
    },
  });

  const handleDragStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches ? e.touches[0] : e;
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    setDragOffset({ x: deltaX, y: deltaY });

    // Calculate swipe progress (0-1)
    const progress = Math.min(Math.abs(deltaX) / 150, 1);
    setSwipeProgress(progress);

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      setSwipeDirection(deltaX > 0 ? "right" : "left");
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);

    // If swiped far enough, process the swipe
    if (swipeProgress > 0.5) {
      if (swipeDirection === "right") {
        // Swipe right = select/like (add to tournament)
        if (!isSelected) {
          onToggleName(currentName);
        }
      } else if (swipeDirection === "left") {
        // Swipe left = pass (remove from tournament if selected)
        if (isSelected) {
          onToggleName(currentName);
        }
      }

      // Move to next card
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % names.length);
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
        setSwipeProgress(0);
      }, 300);
    } else {
      // Reset card position
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
      setSwipeProgress(0);
    }
  };

  const handleSwipeButton = (direction) => {
    setSwipeDirection(direction);
    setSwipeProgress(1);

    setTimeout(() => {
      if (direction === "right") {
        // Right button = select/like (add to tournament)
        if (!isSelected) {
          onToggleName(currentName);
        }
      } else if (direction === "left") {
        // Left button = pass (remove from tournament if selected)
        if (isSelected) {
          onToggleName(currentName);
        }
      }

      setCurrentIndex((prev) => (prev + 1) % names.length);
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
      setSwipeProgress(0);
    }, 300);
  };

  if (!currentName) return null;

  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
    opacity: isDragging ? 0.9 : 1,
  };

  const swipeOverlayStyle = {
    opacity: swipeProgress,
    transform: `scale(${0.8 + swipeProgress * 0.2})`,
  };

  return (
    <div className={styles.swipeContainer}>
      <div
        className={`${styles.swipeCardWrapper} ${showCatPictures ? styles.withCatPictures : ""}`}
      >
        <div
          ref={gestureRef}
          className={`${styles.swipeCard} ${isSelected ? styles.selected : ""} ${showCatPictures ? styles.withCatPictures : ""} ${isLongPressing ? styles.longPressing : ""}`}
          style={cardStyle}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Swipe direction overlays - Fixed to show correct overlay */}
          <div
            className={`${styles.swipeOverlay} ${styles.swipeRight} ${swipeDirection === "right" ? styles.active : ""}`}
            style={
              swipeDirection === "right" ? swipeOverlayStyle : { opacity: 0 }
            }
          >
            <span className={styles.swipeText}>👍 SELECTED</span>
          </div>
          <div
            className={`${styles.swipeOverlay} ${styles.swipeLeft} ${swipeDirection === "left" ? styles.active : ""}`}
            style={
              swipeDirection === "left" ? swipeOverlayStyle : { opacity: 0 }
            }
          >
            <span className={styles.swipeText}>👎 SKIPPED</span>
          </div>

          {/* Card content */}
          <div className={styles.swipeCardContent}>
            {/* Cat picture when enabled */}
            {showCatPictures && imageSrc && (
              <CatImage
                src={imageSrc}
                containerClassName={styles.swipeCardImageContainer}
                imageClassName={styles.swipeCardImage}
                loading="eager"
                decoding="async"
              />
            )}

            <h3 className={styles.swipeCardName}>{currentName.name}</h3>
            <p className={styles.swipeCardDescription}>
              {currentName.description || DEFAULT_DESCRIPTION}
            </p>

            {/* Admin metadata */}
            {isAdmin && (
              <div className={styles.swipeCardMetadata}>
                {currentName.avg_rating && (
                  <span className={styles.metadataItem}>
                    ⭐ {currentName.avg_rating}
                  </span>
                )}
                {currentName.popularity_score && (
                  <span className={styles.metadataItem}>
                    🔥 {currentName.popularity_score}
                  </span>
                )}
                {currentName.categories &&
                  currentName.categories.length > 0 && (
                    <span className={styles.metadataItem}>
                      🏷️ {currentName.categories.join(", ")}
                    </span>
                  )}
              </div>
            )}
          </div>

          {/* Selection indicator - Only show when selected */}
          {isSelected && (
            <div className={`${styles.selectionIndicator} ${styles.selected}`}>
              ✓ Selected
            </div>
          )}
        </div>
      </div>

      {/* Swipe buttons */}
      <div className={styles.swipeButtons}>
        <button
          onClick={() => handleSwipeButton("left")}
          className={`${styles.swipeButton} ${styles.swipeLeftButton}`}
          // Remove disabled state - always allow skipping
        >
          👎 Skip
        </button>

        <div className={styles.cardProgress}>
          {currentIndex + 1} of {names.length}
        </div>

        <button
          onClick={() => handleSwipeButton("right")}
          className={`${styles.swipeButton} ${styles.swipeRightButton}`}
          // Remove disabled state - always allow selecting
        >
          👍 Select
        </button>
      </div>
    </div>
  );
};

// * StartButton and NameSuggestionSection are imported from ./components
// * Lightbox is imported from ./components

// * Custom hook for tournament setup logic
function useTournamentSetup(userName) {
  const [availableNames, setAvailableNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);
  const lastSavedHashRef = useRef("");

  // * Error handling is now managed by the store

  // * Get error state and actions from store
  const { errors, errorActions } = useAppStore();

  useEffect(() => {
    const fetchNames = async () => {
      try {
        setIsLoading(true);
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) {
          setAvailableNames(FALLBACK_NAMES);
          setIsLoading(false);
          return;
        }

        // Get all names and hidden names in parallel for efficiency
        const [namesData, { data: hiddenData, error: hiddenError }] =
          await Promise.all([
            getNamesWithDescriptions(),
            supabaseClient
              .from("cat_name_ratings")
              .select("name_id")
              .eq("is_hidden", true),
          ]);

        if (hiddenError) {
          throw hiddenError;
        }

        // Create Set of hidden IDs for O(1) lookup
        const hiddenIds = new Set(
          hiddenData?.map((item) => item.name_id) || []
        );

        // Filter out hidden names
        const filteredNames = namesData.filter(
          (name) => !hiddenIds.has(name.id)
        );

        // Sort names alphabetically for better UX

        const sortedNames = filteredNames.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        devLog("🎮 TournamentSetup: Data loaded", {
          availableNames: sortedNames.length,
          hiddenNames: hiddenIds.size,
          userPreferences: hiddenData?.length || 0,
        });

        setAvailableNames(sortedNames);

        // If any currently selected names are now hidden, remove them
        setSelectedNames((prev) =>
          prev.filter((name) => !hiddenIds.has(name.id))
        );
      } catch (err) {
        // Provide a clear offline fallback list when backend fails
        setAvailableNames(FALLBACK_NAMES);
        errorActions.logError(err, "TournamentSetup - Fetch Names", {
          isRetryable: true,
          affectsUserData: false,
          isCritical: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [errorActions, userName]);

  // Save tournament selections to database
  const saveTournamentSelections = useCallback(
    async (selectedNames) => {
      try {
        // Create a unique tournament ID for this selection session
        const tournamentId = `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Save selections to database
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) return;

        const result = await tournamentsAPI.saveTournamentSelections(
          userName,
          selectedNames,
          tournamentId
        );

        devLog("🎮 TournamentSetup: Selections saved to database", result);
      } catch (error) {
        console.error("Error saving tournament selections:", error);
        // Don't block the UI if saving fails
      }
    },
    [userName]
  );

  const scheduleSave = useCallback(
    (namesToSave) => {
      if (!userName || !Array.isArray(namesToSave) || namesToSave.length === 0)
        return;

      const hash = namesToSave
        .map((n) => n.id || n.name)
        .sort()
        .join(",");

      if (hash === lastSavedHashRef.current) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        lastSavedHashRef.current = hash;
        saveTournamentSelections(namesToSave).catch((e) =>
          console.warn("Save selections debounce error:", e)
        );
      }, 800);
    },
    [userName, saveTournamentSelections]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const toggleName = async (nameObj) => {
    setSelectedNames((prev) => {
      const newSelectedNames = prev.some((n) => n.id === nameObj.id)
        ? prev.filter((n) => n.id !== nameObj.id)
        : [...prev, nameObj];

      // Log the updated selected names (throttled to avoid spam)
      if (!toggleName.lastLogTs || Date.now() - toggleName.lastLogTs > 1000) {
        devLog("🎮 TournamentSetup: Selected names updated", newSelectedNames);
        toggleName.lastLogTs = Date.now();
      }

      // Debounce save of selections to database
      scheduleSave(newSelectedNames);

      return newSelectedNames;
    });
  };

  const handleSelectAll = () => {
    setSelectedNames(
      selectedNames.length === availableNames.length ? [] : [...availableNames]
    );
  };

  return {
    availableNames,
    selectedNames,
    isLoading,
    errors: errors.history,
    isError: !!errors.current,
    clearErrors: () => errorActions.clearError(),
    clearError: () => errorActions.clearError(),
    toggleName,
    handleSelectAll,
  };
}

function TournamentSetupContent({ onStart, userName }) {
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

  // Enhanced state for new features
  const [openImages, setOpenImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [showCatPictures, setShowCatPictures] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [galleryImages, setGalleryImages] = useState(CAT_IMAGES);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load gallery dynamically from Supabase Storage (cat-images bucket)
  // Merge with static gallery.json and built-in defaults (de-dup by basename)
  useEffect(() => {
    let cancelled = false;
    const trySupabase = async () => {
      try {
        const supabaseClient = await resolveSupabaseClient();

        if (!supabaseClient) return false;
        const list = await imagesAPI.list("");
        if (Array.isArray(list) && list.length) return list;
      } catch {
        // Ignore errors when trying to load images
      }
      return [];
    };

    const tryStaticManifest = async () => {
      try {
        const res = await fetch("/assets/images/gallery.json");
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
      } catch {
        // Ignore errors when trying to load images
      }
      return [];
    };

    (async () => {
      const supa = await trySupabase();
      const manifest = await tryStaticManifest();

      // * Merge: supa first, then manifest, then built-ins
      const merged = [...(supa || []), ...(manifest || []), ...CAT_IMAGES];

      // * Deduplicate by base name (ignore extension), prefer earlier entries
      const deduped = deduplicateImages(merged);

      if (!cancelled) setGalleryImages(deduped);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // * Get categories and other enhanced data
  const [categories, setCategories] = useState([]);

  // * Derive categories from available names to avoid schema coupling
  useEffect(() => {
    setCategories(extractCategories(availableNames));
  }, [availableNames]);

  // Admin detection using role-based authentication
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userName) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminStatus = await isUserAdmin(userName);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [userName]);

  const handleImageOpen = (image) => {
    const idx = galleryImages.indexOf(image);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const handleMouseMove = (e) => {
    setOpenImages((prev) =>
      prev.map((img) => {
        if (img.isDragging) {
          return {
            ...img,
            position: {
              x: e.clientX - img.dragStart.x,
              y: e.clientY - img.dragStart.y,
            },
          };
        }
        return img;
      })
    );
  };

  const handleMouseUp = () => {
    setOpenImages((prev) =>
      prev.map((img) => ({
        ...img,
        isDragging: false,
      }))
    );
  };

  const handleResizeMove = (e) => {
    setOpenImages((prev) =>
      prev.map((img) => {
        if (img.isResizing) {
          const deltaX = e.clientX - img.resizeStart.x;
          const aspectRatio = img.size.width / img.size.height;

          let newWidth = img.size.width;
          let newHeight = img.size.height;

          switch (img.resizeHandle) {
            case "nw":
              newWidth = Math.max(200, img.size.width - deltaX);
              newHeight = newWidth / aspectRatio;
              break;
            case "ne":
              newWidth = Math.max(200, img.size.width + deltaX);
              newHeight = newWidth / aspectRatio;
              break;
            case "sw":
              newWidth = Math.max(200, img.size.width - deltaX);
              newHeight = newWidth / aspectRatio;
              break;
            case "se":
              newWidth = Math.max(200, img.size.width + deltaX);
              newHeight = newWidth / aspectRatio;
              break;
          }

          return {
            ...img,
            size: {
              width: newWidth,
              height: newHeight,
            },
            resizeStart: {
              x: e.clientX,
              y: e.clientY,
            },
          };
        }
        return img;
      })
    );
  };

  const handleResizeEnd = () => {
    setOpenImages((prev) =>
      prev.map((img) => ({
        ...img,
        isResizing: false,
        resizeHandle: null,
      }))
    );
  };

  useEffect(() => {
    const hasDragging = openImages.some((img) => img.isDragging);
    const hasResizing = openImages.some((img) => img.isResizing);

    if (hasDragging || hasResizing) {
      window.addEventListener(
        "mousemove",
        hasResizing ? handleResizeMove : handleMouseMove
      );
      window.addEventListener(
        "mouseup",
        hasResizing ? handleResizeEnd : handleMouseUp
      );
      return () => {
        window.removeEventListener(
          "mousemove",
          hasResizing ? handleResizeMove : handleMouseMove
        );
        window.removeEventListener(
          "mouseup",
          hasResizing ? handleResizeEnd : handleMouseUp
        );
      };
    }
  }, [openImages]);

  if (isLoading) {
    return <Loading variant="spinner" />;
  }

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
      <div className={styles.mainContent}>
        {/* Selection Panel */}
        <div className={styles.selectionPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.headerRow}>
              <div className={styles.headerContent}>
                <h2 className={styles.panelTitle}>
                  Select Tournament Competitors
                </h2>
                <p className={styles.panelSubtitle}>
                  Choose at least 2 names to start your tournament
                </p>
              </div>
              <div className={styles.headerActions}>
                <button
                  onClick={handleSelectAll}
                  className={styles.selectAllButton}
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

                <button
                  onClick={() => setIsSwipeMode(!isSwipeMode)}
                  className={`${styles.headerActionButton} ${styles.swipeModeToggleButton} ${
                    isSwipeMode ? styles.headerActionButtonActive : ""
                  }`}
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

            {/* Name count for all users */}
            <Card
              className={styles.nameCount}
              padding="small"
              shadow="medium"
              background="glass"
              as="section"
              aria-live="polite"
            >
              <span className={styles.countText}>
                {selectedNames.length === 0
                  ? "Pick some pawsome names! 🐾"
                  : `${selectedNames.length} Names Selected`}
              </span>

              {selectedNames.length === 1 && (
                <span className={styles.helperText} role="alert">
                  Just one more to start! 🎯
                </span>
              )}
            </Card>

            {/* Admin-only enhanced statistics */}
            {isAdmin && (
              <div className={styles.nameStats}>
                <span className={styles.statItem}>
                  📊 {availableNames.length} total names
                </span>
                <span className={styles.statItem}>
                  ⭐{" "}
                  {availableNames.length > 0
                    ? Math.round(
                        availableNames.reduce(
                          (sum, name) => sum + (name.avg_rating || 1500),
                          0
                        ) / availableNames.length
                      )
                    : 1500}{" "}
                  avg rating
                </span>
                <span className={styles.statItem}>
                  🔥{" "}
                  {
                    availableNames.filter(
                      (name) => (name.popularity_score || 0) > 5
                    ).length
                  }{" "}
                  popular names
                </span>
              </div>
            )}
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
            onSwipeModeToggle={() => setIsSwipeMode(!isSwipeMode)}
            showCatPictures={showCatPictures}
            imageList={galleryImages}
          />

          {selectedNames.length >= 2 && (
            <div className={styles.startSection}>
              <StartButton selectedNames={selectedNames} onStart={onStart} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <Card
            className={styles.sidebarCard}
            padding="large"
            shadow="large"
            as="section"
            aria-labelledby="tournament-setup-overview"
          >
            <div className={styles.tournamentHeader}>
              <h1
                id="tournament-setup-overview"
                className={styles.tournamentTitle}
              >
                🏆 Cat Name Tournament
              </h1>
              <p className={styles.tournamentSubtitle}>
                Pick the perfect name for your cat through fun head-to-head
                battles!
              </p>
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

            <div className={styles.starsSection}>
              <h3 className={styles.starsTitle}>Cat Photos 📸</h3>
              <p className={styles.starsDescription}>
                Click any photo to get a closer look
              </p>
              <div className={styles.photoGrid}>
                {(showAllPhotos
                  ? galleryImages
                  : galleryImages.slice(0, 8)
                ).map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`${styles.photoThumbnail} ${styles.photoThumbButton}`}
                    onClick={() => handleImageOpen(image)}
                    aria-label={`Open cat photo ${index + 1}`}
                  >
                    {image.startsWith("/assets/images/") ? (
                      (() => {
                        const base = image.replace(/\.[^.]+$/, "");
                        return (
                          <picture>
                            <source
                              type="image/avif"
                              srcSet={`${base}.avif`}
                              sizes={GALLERY_IMAGE_SIZES}
                            />
                            <source
                              type="image/webp"
                              srcSet={`${base}.webp`}
                              sizes={GALLERY_IMAGE_SIZES}
                            />
                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              width="200"
                              height="200"
                              sizes={GALLERY_IMAGE_SIZES}
                            />
                          </picture>
                        );
                      })()
                    ) : (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width="200"
                        height="200"
                        sizes={GALLERY_IMAGE_SIZES}
                      />
                    )}
                    <div className={styles.photoOverlay}>
                      <span className={styles.photoIcon}>👁️</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className={styles.photoToolbar}>
                {galleryImages.length > 8 && (
                  <div className={styles.photoActionsRow}>
                    <button
                      type="button"
                      className={styles.photoMoreButton}
                      onClick={() => setShowAllPhotos((v) => !v)}
                    >
                      {showAllPhotos
                        ? "Show fewer photos"
                        : `Show ${galleryImages.length - 8} more photos`}
                    </button>
                  </div>
                )}

                {isAdmin && (
                  <div className={styles.photoUploadRow}>
                    <input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        try {
                          const uploaded = [];
                          for (const f of files) {
                            const compressed = await compressImageFile(f, {
                              maxWidth: 1600,
                              maxHeight: 1600,
                              quality: 0.82,
                            });
                            const url = await imagesAPI.upload(
                              compressed,
                              userName || "aaron"
                            );
                            if (url) uploaded.push(url);
                          }
                          if (uploaded.length) {
                            setGalleryImages((prev) => [...uploaded, ...prev]);
                          }
                        } catch (err) {
                          console.error("Upload failed", err);

                          alert("Upload failed. Please try again.");
                        } finally {
                          e.target.value = "";
                        }
                      }}
                    />
                    <label
                      htmlFor="gallery-upload"
                      className={styles.photoUploadButton}
                    >
                      Upload Photos
                    </label>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card
            className={styles.sidebarCard}
            padding="large"
            shadow="large"
            as="section"
            aria-label="Name suggestions"
          >
            <NameSuggestionSection />
          </Card>
        </aside>
      </div>

      {lightboxOpen && (
        <Lightbox
          images={galleryImages}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() =>
            setLightboxIndex(
              (i) => (i - 1 + galleryImages.length) % galleryImages.length
            )
          }
          onNext={() => setLightboxIndex((i) => (i + 1) % galleryImages.length)}
        />
      )}
    </div>
  );
}

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
};

export default TournamentSetup;
