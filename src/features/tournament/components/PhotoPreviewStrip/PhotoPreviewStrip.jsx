/**
 * @module PhotoPreviewStrip
 * @description Compact photo preview strip that shows 4-5 thumbnails, clicking expands to Photos view
 */
import { memo, useCallback } from "react";
import PropTypes from "prop-types";
import useAppStore from "../../../../core/store/useAppStore";
import styles from "./PhotoPreviewStrip.module.css";

const PhotoPreviewStrip = memo(({ images, onImageClick, maxThumbnails = 5 }) => {
  const setCurrentView = useAppStore((state) => state.tournament.setCurrentView);
  
  const displayImages = images.slice(0, maxThumbnails);
  const remainingCount = Math.max(0, images.length - maxThumbnails);

  const handleViewPhotos = useCallback(() => {
    setCurrentView("photos");
  }, [setCurrentView]);

  const handleThumbnailClick = useCallback((image) => {
    if (onImageClick) {
      onImageClick(image);
    }
  }, [onImageClick]);

  if (!images || images.length === 0) return null;

  return (
    <div className={styles.strip}>
      <div className={styles.header}>
        <span className={styles.title}>📸 Photos</span>
        <button 
          type="button" 
          className={styles.viewAllButton}
          onClick={handleViewPhotos}
        >
          View all {images.length}
        </button>
      </div>
      <div className={styles.thumbnails}>
        {displayImages.map((image, index) => {
          const isLocalAsset = image.startsWith("/assets/images/");
          const isGif = image.toLowerCase().endsWith(".gif");
          const shouldUsePicture = isLocalAsset && !isGif;
          const base = shouldUsePicture ? image.replace(/\.[^.]+$/, "") : null;

          return (
            <button
              key={image}
              type="button"
              className={styles.thumbnail}
              onClick={() => handleThumbnailClick(image)}
              aria-label={`View photo ${index + 1}`}
            >
              {shouldUsePicture && base ? (
                <picture>
                  <source type="image/avif" srcSet={`${base}.avif`} />
                  <source type="image/webp" srcSet={`${base}.webp`} />
                  <img src={image} alt="" loading="lazy" decoding="async" />
                </picture>
              ) : (
                <img src={image} alt="" loading="lazy" decoding="async" />
              )}
              <div className={styles.overlay} />
            </button>
          );
        })}
        {remainingCount > 0 && (
          <button
            type="button"
            className={`${styles.thumbnail} ${styles.moreButton}`}
            onClick={handleViewPhotos}
            aria-label={`View ${remainingCount} more photos`}
          >
            <span className={styles.moreCount}>+{remainingCount}</span>
            <span className={styles.moreText}>more</span>
          </button>
        )}
      </div>
    </div>
  );
});

PhotoPreviewStrip.displayName = "PhotoPreviewStrip";

PhotoPreviewStrip.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  onImageClick: PropTypes.func,
  maxThumbnails: PropTypes.number,
};

export default PhotoPreviewStrip;
