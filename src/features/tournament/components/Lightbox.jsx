/**
 * @module TournamentSetup/Lightbox
 * @description Lightweight lightbox component with keyboard navigation
 */

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { LIGHTBOX_IMAGE_SIZES } from "../constants";
import styles from "../TournamentSetup.module.css";

function Lightbox({ images, index, onClose, onPrev, onNext }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  const current = images[index] || images[0];
  const base = current.replace(/\.[^.]+$/, "");

  return (
    <div
      className={styles.overlayBackdrop}
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
          onClick={onPrev}
          aria-label="Previous photo"
        >
          ‹
        </button>
        <div className={styles.lightboxImageWrap}>
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
              alt={`Cat photo ${index + 1} of ${images.length}`}
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
          onClick={onNext}
          aria-label="Next photo"
        >
          ›
        </button>
        <div className={styles.lightboxCounter} aria-live="polite">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

Lightbox.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  index: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default Lightbox;

