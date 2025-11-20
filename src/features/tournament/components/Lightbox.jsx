/**
 * @module TournamentSetup/Lightbox
 * @description Lightweight lightbox component with keyboard navigation and smooth transitions
 */

import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { LIGHTBOX_IMAGE_SIZES } from "../constants";
import styles from "../TournamentSetup.module.css";

function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  preloadImages = [],
}) {
  const closeBtnRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const [slideDirection, setSlideDirection] = useState(null);

  const handleNavigate = useCallback(
    (newIndex) => {
      if (isTransitioningRef.current) return;

      isTransitioningRef.current = true;

      if (newIndex > currentIndex) {
        setSlideDirection("right");
      } else if (newIndex < currentIndex) {
        setSlideDirection("left");
      }

      onNavigate(newIndex);

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 300);
    },
    [currentIndex, onNavigate]
  );

  const handlePrev = useCallback(() => {
    if (!images || images.length === 0) return;
    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    const newIndex = safeIndex === 0 ? images.length - 1 : safeIndex - 1;
    handleNavigate(newIndex);
  }, [currentIndex, handleNavigate, images]);

  const handleNext = useCallback(() => {
    if (!images || images.length === 0) return;
    const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
    const newIndex = safeIndex === images.length - 1 ? 0 : safeIndex + 1;
    handleNavigate(newIndex);
  }, [currentIndex, handleNavigate, images]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, onClose]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    },
    []
  );

  // * Validate images array and close lightbox if invalid
  useEffect(() => {
    if (!images || images.length === 0) {
      onClose();
    }
  }, [images, onClose]);

  // * Validate currentIndex and close lightbox if out of bounds
  useEffect(() => {
    if (images && images.length > 0) {
      const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
      const current = images[safeIndex];
      if (!current || typeof current !== "string") {
        onClose();
      }
    }
  }, [images, currentIndex, onClose]);

  // * Early return if no valid images
  if (!images || images.length === 0) {
    return null;
  }

  // * Ensure currentIndex is within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));
  const current = images[safeIndex];

  // * Early return if current image is invalid
  if (!current || typeof current !== "string") {
    return null;
  }

  // * Extract base path for alternative formats (handle URLs with query params)
  // * Remove query string and hash first, then remove extension
  const urlWithoutQuery = current.split("?")[0].split("#")[0];
  const base = urlWithoutQuery.replace(/\.[^.]+$/, "") || urlWithoutQuery;

  // Preload adjacent images for smoother navigation
  useEffect(() => {
    // * Only preload if lightbox is open and images are available
    if (!images || images.length === 0 || preloadImages.length === 0) {
      return;
    }

    const links = [];
    preloadImages.forEach((imgUrl) => {
      if (imgUrl) {
        // * Use Image object for more reliable preloading
        const img = new Image();
        img.src = imgUrl;
        // * Also add link preload for better browser optimization
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = imgUrl;
        document.head.appendChild(link);
        links.push(link);
      }
    });

    return () => {
      links.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [preloadImages, images]);

  return (
    <div
      className={styles.lightboxOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
    >
      <div
        className={styles.lightboxContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.lightboxClose}
          onClick={onClose}
          aria-label="Close gallery (or press Escape)"
          title="Close (ESC)"
          ref={closeBtnRef}
        >
          ×
        </button>
        <button
          type="button"
          className={`${styles.lightboxNav} ${styles.left}`}
          onClick={handlePrev}
          aria-label="Previous photo"
        >
          ‹
        </button>
        <div
          className={`${styles.lightboxImageWrap} ${
            slideDirection
              ? styles[
                  `slide${slideDirection.charAt(0).toUpperCase() + slideDirection.slice(1)}`
                ]
              : ""
          }`}
          key={safeIndex}
        >
          <picture>
            {base && base !== urlWithoutQuery && (
              <>
                <source
                  type="image/avif"
                  srcSet={`${base}.avif`}
                  sizes={LIGHTBOX_IMAGE_SIZES}
                />
                <source
                  type="image/webp"
                  srcSet={`${base}.webp`}
                  sizes={LIGHTBOX_IMAGE_SIZES}
                />
              </>
            )}
            <img
              src={current}
              alt={`Cat photo ${safeIndex + 1} of ${images.length}`}
              className={styles.lightboxImage}
              loading="eager"
              decoding="async"
              sizes={LIGHTBOX_IMAGE_SIZES}
              onError={() => {
                // * If image fails to load, close lightbox to prevent broken image display
                console.error("Failed to load image:", current);
                onClose();
              }}
            />
          </picture>
        </div>
        <button
          type="button"
          className={`${styles.lightboxNav} ${styles.right}`}
          onClick={handleNext}
          aria-label="Next photo"
        >
          ›
        </button>
        <div className={styles.lightboxCounter} aria-live="polite">
          {safeIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

Lightbox.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentIndex: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  preloadImages: PropTypes.arrayOf(PropTypes.string),
};

export default Lightbox;
