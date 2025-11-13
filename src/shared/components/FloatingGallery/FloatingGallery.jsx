/**
 * @module FloatingGallery
 * @description A premium, minimal floating photo gallery component that displays
 * photos in a floating layout with no background or wrapper containers.
 * The photos appear to float naturally on the page background.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './FloatingGallery.module.css';

/**
 * FloatingGallery Component
 * @param {Object} props
 * @param {Array<Object>} props.photos - Array of photo objects with src and alt
 * @param {number} [props.columns=3] - Number of columns in the gallery
 * @param {boolean} [props.autoRotate=true] - Auto-rotate photos
 * @param {number} [props.rotationDelay=5000] - Delay between rotations in ms
 */
function FloatingGallery({
  photos = [],
  columns = 3,
  autoRotate = false,
  rotationDelay = 5000,
  className = ''
}) {
  const [imageIndices, setImageIndices] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize random images for each position
  useEffect(() => {
    if (photos.length === 0) return;

    const indices = {};
    for (let i = 0; i < columns; i++) {
      indices[i] = Math.floor(Math.random() * photos.length);
    }
    setImageIndices(indices);
    setIsLoading(false);
  }, [photos.length, columns]);

  // Auto-rotate photos
  useEffect(() => {
    if (!autoRotate || photos.length === 0 || isLoading) return;

    const interval = setInterval(() => {
      setImageIndices(prev => {
        const newIndices = { ...prev };
        const randomCol = Math.floor(Math.random() * columns);
        newIndices[randomCol] = (newIndices[randomCol] + 1) % photos.length;
        return newIndices;
      });
    }, rotationDelay);

    return () => clearInterval(interval);
  }, [autoRotate, photos.length, rotationDelay, columns]);

  if (photos.length === 0 || isLoading) {
    return null;
  }

  return (
    <div className={`${styles.gallery} ${className}`} role="region" aria-label="Photo gallery">
      {Array.from({ length: columns }).map((_, colIndex) => {
        const photoIndex = imageIndices[colIndex] || 0;
        const photo = photos[photoIndex];

        if (!photo) return null;

        return (
          <div
            key={colIndex}
            className={styles.photoFloat}
            style={{ '--col-index': colIndex } as React.CSSProperties & { '--col-index': number }}
          >
            <picture className={styles.photoPicture}>
              {photo.avif && (
                <source type="image/avif" srcSet={photo.avif} />
              )}
              {photo.webp && (
                <source type="image/webp" srcSet={photo.webp} />
              )}
              <img
                src={photo.src}
                alt={photo.alt || `Gallery photo ${photoIndex + 1}`}
                className={styles.photo}
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
        );
      })}
    </div>
  );
}

FloatingGallery.propTypes = {
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
      webp: PropTypes.string,
      avif: PropTypes.string
    })
  ),
  columns: PropTypes.number,
  autoRotate: PropTypes.bool,
  rotationDelay: PropTypes.number,
  className: PropTypes.string
};

export default FloatingGallery;