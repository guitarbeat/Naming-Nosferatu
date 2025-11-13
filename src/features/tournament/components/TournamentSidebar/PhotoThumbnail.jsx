/**
 * @module TournamentSetup/components/PhotoThumbnail
 * @description Photo thumbnail with responsive image sources and 3D tilt effect
 */
import PropTypes from "prop-types";
import { useTiltEffect } from "../../../../shared/hooks/useTiltEffect";
import { GALLERY_IMAGE_SIZES } from "../../constants";
import styles from "../../TournamentSetup.module.css";

function PhotoThumbnail({ image, index, onImageOpen }) {
  const { elementRef, style } = useTiltEffect({
    maxRotation: 8,
    perspective: 1000,
    smoothing: 0.1,
    scale: 1.03,
  });

  return (
    <button
      key={image}
      ref={elementRef}
      type="button"
      className={`${styles.photoThumbnail} ${styles.photoThumbButton}`}
      onClick={() => onImageOpen(image)}
      style={style}
      aria-label={`Open cat photo ${index + 1}`}
    >
      {image.startsWith("/assets/images/") ? (
        (() => {
          const base = image.substring(0, image.lastIndexOf("."));
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
  );
}

PhotoThumbnail.propTypes = {
  image: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onImageOpen: PropTypes.func.isRequired,
};

export default PhotoThumbnail;

