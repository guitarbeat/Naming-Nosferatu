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
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });
  const minSwipeDistance = 50;

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
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    handleNavigate(newIndex);
  }, [currentIndex, handleNavigate, images.length]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(newIndex);
  }, [currentIndex, handleNavigate, images.length]);

  // * Touch gesture handlers for mobile
  const onTouchStart = useCallback((e) => {
    const touch = e.targetTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchEndRef.current = { x: 0, y: 0 };
  }, []);

  const onTouchMove = useCallback((e) => {
    const touch = e.targetTouches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current.x) return;

    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = touchStartRef.current.y - touchEndRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // * Determine if horizontal or vertical swipe
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      // * Horizontal swipe - navigate
      if (deltaX > 0) {
        handleNext(); // Swipe left = next
      } else {
        handlePrev(); // Swipe right = previous
      }
    } else if (
      absDeltaY > absDeltaX &&
      absDeltaY > minSwipeDistance &&
      deltaY < 0
    ) {
      // * Swipe down to close
      onClose();
    }

    // * Reset
    touchStartRef.current = { x: 0, y: 0 };
    touchEndRef.current = { x: 0, y: 0 };
  }, [handleNext, handlePrev, onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev, onClose]);

  // * Lock body scroll when lightbox is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

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

  // * Simple fallback pattern - original working approach
  const current = images[currentIndex] || images[0];
  const base = current?.replace(/\.[^.]+$/, "") || "";

  // * Check if this is a local asset that might have alternative formats
  // * GIF files typically don't have .avif/.webp versions, so skip picture element
  const isLocalAsset = current?.startsWith("/assets/images/");
  const isGif = current?.toLowerCase().endsWith(".gif");
  const shouldUsePicture = isLocalAsset && !isGif;

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
          key={currentIndex}
          onTouchStart={(e) => {
            e.stopPropagation();
            onTouchStart(e);
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
            onTouchMove(e);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onTouchEnd();
          }}
        >
          {shouldUsePicture ? (
            <picture>
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
              <img
                src={current}
                alt=""
                className={styles.lightboxImage}
                loading="eager"
                decoding="async"
                sizes={LIGHTBOX_IMAGE_SIZES}
              />
            </picture>
          ) : (
            <img
              src={current}
              alt=""
              className={styles.lightboxImage}
              loading="eager"
              decoding="async"
              sizes={LIGHTBOX_IMAGE_SIZES}
            />
          )}
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
          {currentIndex + 1} / {images.length}
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
