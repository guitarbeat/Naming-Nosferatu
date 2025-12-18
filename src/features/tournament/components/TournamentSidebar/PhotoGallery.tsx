/**
 * @module TournamentSetup/components/PhotoGallery
 * @description Photo gallery with upload functionality for admin users
 */
import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { compressImageFile } from "../../../../shared/utils/coreUtils";
import { imagesAPI } from "../../../../shared/services/supabase/api";
import { devError } from "../../../../shared/utils/logger";
import PhotoThumbnail from "./PhotoThumbnail";
import styles from "../../TournamentSetup.module.css";

interface PhotoGalleryProps {
  galleryImages?: string[];
  showAllPhotos: boolean;
  onShowAllPhotosToggle: () => void;
  onImageOpen: (image: string) => void;
  isAdmin: boolean;
  userName?: string;
  onImagesUploaded: (images: string[]) => void;
}

function PhotoGallery({
  galleryImages = [],
  showAllPhotos,
  onShowAllPhotosToggle,
  onImageOpen,
  isAdmin,
  userName,
  onImagesUploaded,
}: PhotoGalleryProps) {
  // * Ensure galleryImages is always an array
  const safeGalleryImages = useMemo(
    () => (Array.isArray(galleryImages) ? galleryImages : []),
    [galleryImages],
  );

  const displayImages = useMemo(
    () => (showAllPhotos ? safeGalleryImages : safeGalleryImages.slice(0, 8)),
    [safeGalleryImages, showAllPhotos],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      try {
        const uploaded: string[] = [];
        const uploadPromises = files.map(async (f) => {
          try {
            const compressed = await compressImageFile(f, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.82,
            });
            const url = await imagesAPI.upload(compressed, userName || "aaron");
            if (url) uploaded.push(url);
          } catch (fileError) {
            devError(`Failed to upload ${f.name}:`, fileError);
          }
        });

        await Promise.all(uploadPromises);

        if (uploaded.length) {
          onImagesUploaded(uploaded);
        } else {
          alert("No images were uploaded. Please try again.");
        }
      } catch (err) {
        devError("Upload failed", err);
        alert("Upload failed. Please try again.");
      } finally {
        e.target.value = "";
      }
    },
    [userName, onImagesUploaded],
  );

  return (
    <div className={styles.starsSection}>
      <div className={styles.galleryHeader}>
        <h3 className={styles.galleryTitle}>Photos</h3>
        <span className={styles.photoCount}>{safeGalleryImages.length}</span>
      </div>
      {safeGalleryImages.length === 0 ? (
        <div className={styles.emptyGallery}>
          <p>No photos available</p>
        </div>
      ) : (
        <div className={styles.photoGrid}>
          {displayImages.map((image, index) => {
            // * Calculate size for mosaic effect - vary based on index
            const imageHash = image
              .split("")
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hashMod = Math.abs(imageHash) % 100;

            // * Row span: vary from 4-10 rows (80-200px) for visual interest
            const rowSpan = 4 + (hashMod % 7); // * 4-10 rows

            // * Column span: create variety (1-2 columns)
            let colSpan = 1;
            // * 30% of photos get 2 columns for featured effect
            if (hashMod < 30) {
              colSpan = 2;
            }

            return (
              <div
                key={image}
                className={styles.photoWrapper}
                style={{
                  gridRow: `span ${rowSpan}`,
                  gridColumn: colSpan > 1 ? `span ${colSpan}` : "auto",
                }}
                data-col-span={colSpan}
                data-row-span={rowSpan}
              >
                <PhotoThumbnail
                  image={image}
                  index={index}
                  onImageOpen={onImageOpen}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.photoToolbar}>
        {safeGalleryImages.length > 8 && (
          <div className={styles.photoActionsRow}>
            <button
              type="button"
              className={styles.photoMoreButton}
              onClick={onShowAllPhotosToggle}
            >
              {showAllPhotos
                ? "Show fewer photos"
                : `Show ${safeGalleryImages.length - 8} more photos`}
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
              onChange={handleFileUpload}
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
  );
}

PhotoGallery.propTypes = {
  galleryImages: PropTypes.arrayOf(PropTypes.string).isRequired,
  showAllPhotos: PropTypes.bool.isRequired,
  onShowAllPhotosToggle: PropTypes.func.isRequired,
  onImageOpen: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  userName: PropTypes.string,
  onImagesUploaded: PropTypes.func.isRequired,
};

export default PhotoGallery;
