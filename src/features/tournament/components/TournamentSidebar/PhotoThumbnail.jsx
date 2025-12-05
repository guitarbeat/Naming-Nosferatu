/**
 * @module TournamentSetup/components/PhotoThumbnail
 * @description Photo thumbnail with responsive image sources and 3D tilt effect
 */
import { useState, useCallback, memo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { GALLERY_IMAGE_SIZES } from "../../constants";
import styles from "../../TournamentSetup.module.css";

const PhotoThumbnail = memo(({ image, index, onImageOpen }) => {
  const elementRef = useRef(null);

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  // * 3D tilt effect that follows mouse
  useEffect(() => {
    const element = elementRef.current;
    if (!element || imageError) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5; // * Max 5 degrees
      const rotateY = ((x - centerX) / centerX) * 5; // * Max 5 degrees

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 0.1s ease-out",
      });
    };

    const handleMouseLeave = () => {
      setTiltStyle({
        transform:
          "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)",
        transition: "transform 0.3s ease-out",
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [imageError]);

  const handleClick = useCallback(
    (e) => {
      // * Prevent event propagation to avoid triggering parent handlers
      e.preventDefault();
      e.stopPropagation();

      // * Validate image before opening
      if (!image || typeof image !== "string") {
        console.warn("PhotoThumbnail: Invalid image provided:", image);
        return;
      }

      onImageOpen(image);
    },
    [image, onImageOpen],
  );

  // * Validate image prop
  if (!image || typeof image !== "string") {
    return null;
  }

  const isLocalAsset = image.startsWith("/assets/images/");
  const isGif = image.toLowerCase().endsWith(".gif");
  // * GIF files typically don't have .avif/.webp versions, so skip picture element
  const shouldUsePicture = isLocalAsset && !isGif;
  const base = shouldUsePicture
    ? image.substring(0, image.lastIndexOf("."))
    : null;

  return (
    <button
      ref={elementRef}
      type="button"
      className={`${styles.photoThumbnail} ${styles.photoThumbButton} ${imageLoading ? styles.imageLoading : ""} ${imageError ? styles.imageError : ""}`}
      onClick={handleClick}
      aria-label={`Open cat photo ${index + 1}`}
      disabled={imageError}
      style={tiltStyle}
    >
      {imageError ? (
        <div className={styles.imageErrorPlaceholder}>
          <span className={styles.errorIcon}>📷</span>
          <span className={styles.errorText}>Failed to load</span>
        </div>
      ) : (
        <>
          {shouldUsePicture && base ? (
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
                alt={`Cat photo ${index + 1}`}
                loading="lazy"
                decoding="async"
                width="200"
                height="200"
                sizes={GALLERY_IMAGE_SIZES}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </picture>
          ) : (
            <img
              src={image}
              alt={`Cat photo ${index + 1}`}
              loading="lazy"
              decoding="async"
              width="200"
              height="200"
              sizes={GALLERY_IMAGE_SIZES}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          {imageLoading && (
            <div className={styles.imageLoadingPlaceholder}>
              <div className={styles.loadingSpinner} />
            </div>
          )}
        </>
      )}
      {!imageError && (
        <div className={styles.photoOverlay}>
          <span className={styles.photoIcon}>👁️</span>
        </div>
      )}
    </button>
  );
});

PhotoThumbnail.propTypes = {
  image: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onImageOpen: PropTypes.func.isRequired,
};

PhotoThumbnail.displayName = "PhotoThumbnail";

export default PhotoThumbnail;
