/**
 * @module TournamentSetup/components/PhotoThumbnail
 * @description Photo thumbnail with responsive image sources
 */
import PropTypes from "prop-types";
import { GALLERY_IMAGE_SIZES } from "../../constants";
import styles from "../../TournamentSetup.module.css";

function PhotoThumbnail({ image, index, onImageOpen }) {
  return (
    <button
      key={image}
      type="button"
      className={`${styles.photoThumbnail} ${styles.photoThumbButton}`}
      onClick={() => onImageOpen(image)}
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

