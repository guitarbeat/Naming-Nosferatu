/**
 * @module TournamentSetup/components/TournamentSidebar
 * @description Sidebar with photo gallery
 */
import PropTypes from "prop-types";
import PhotoGallery from "./PhotoGallery";
import styles from "../../TournamentSetup.module.css";

function TournamentSidebar({
  galleryImages,
  showAllPhotos,
  onShowAllPhotosToggle,
  onImageOpen,
  isAdmin,
  userName,
  onImagesUploaded,
}) {
  return (
    <aside className={styles.sidebar}>
      <PhotoGallery
        galleryImages={galleryImages}
        showAllPhotos={showAllPhotos}
        onShowAllPhotosToggle={onShowAllPhotosToggle}
        onImageOpen={onImageOpen}
        isAdmin={isAdmin}
        userName={userName}
        onImagesUploaded={onImagesUploaded}
      />
    </aside>
  );
}

TournamentSidebar.propTypes = {
  galleryImages: PropTypes.arrayOf(PropTypes.string).isRequired,
  showAllPhotos: PropTypes.bool.isRequired,
  onShowAllPhotosToggle: PropTypes.func.isRequired,
  onImageOpen: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  userName: PropTypes.string,
  onImagesUploaded: PropTypes.func.isRequired,
};

export default TournamentSidebar;
