/**
 * @module TournamentSetup/Lightbox
 * @description Lightweight lightbox component with keyboard navigation and smooth transitions
 */

import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { LIGHTBOX_IMAGE_SIZES } from "../constants";
import styles from "../TournamentSetup.module.css";

function Lightbox({ images, currentIndex, onClose, onNavigate }) {
  const closeBtnRef = useRef(null);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigate = (newIndex) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    if (newIndex > currentIndex) {
      setSlideDirection("right");
    } else if (newIndex < currentIndex) {
      setSlideDirection("left");
    }

    onNavigate(newIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    handleNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(newIndex);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, currentIndex, images.length]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  const current = images[currentIndex] || images[0];
  const base = current.replace(/\.[^.]+$/, "");

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
          aria-label="Close gallery"
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
            slideDirection ? styles[`slide${slideDirection.charAt(0).toUpperCase() + slideDirection.slice(1)}`] : ""
          }`}
          key={currentIndex}
        >
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
              alt={`Cat photo ${currentIndex + 1} of ${images.length}`}
              className={styles.lightboxImage}
              loading="eager"
              decoding="async"
              sizes={LIGHTBOX_IMAGE_SIZES}
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
};

export default Lightbox;
