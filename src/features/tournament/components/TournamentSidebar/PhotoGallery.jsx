/**
 * @module TournamentSetup/components/PhotoGallery
 * @description Photo gallery with upload functionality for admin users
 */
import PropTypes from "prop-types";
import { compressImageFile } from "../../../../shared/utils/coreUtils";
import { imagesAPI } from "../../../../integrations/supabase/api";
import PhotoThumbnail from "./PhotoThumbnail";
import styles from "../../TournamentSetup.module.css";

function PhotoGallery({
  galleryImages,
  showAllPhotos,
  onShowAllPhotosToggle,
  onImageOpen,
  isAdmin,
  userName,
  onImagesUploaded,
}) {
  const displayImages = showAllPhotos
    ? galleryImages
    : galleryImages.slice(0, 8);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const uploaded = [];
      for (const f of files) {
        const compressed = await compressImageFile(f, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
        });
        const url = await imagesAPI.upload(compressed, userName || "aaron");
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        onImagesUploaded(uploaded);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className={styles.starsSection}>
      <h3 className={styles.starsTitle}>Cat Photos 📸</h3>
      <p className={styles.starsDescription}>
        Click any photo to get a closer look
      </p>
      <div className={styles.photoGrid}>
        {displayImages.map((image, index) => (
          <PhotoThumbnail
            key={image}
            image={image}
            index={index}
            onImageOpen={onImageOpen}
          />
        ))}
      </div>

      <div className={styles.photoToolbar}>
        {galleryImages.length > 8 && (
          <div className={styles.photoActionsRow}>
            <button
              type="button"
              className={styles.photoMoreButton}
              onClick={onShowAllPhotosToggle}
            >
              {showAllPhotos
                ? "Show fewer photos"
                : `Show ${galleryImages.length - 8} more photos`}
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
