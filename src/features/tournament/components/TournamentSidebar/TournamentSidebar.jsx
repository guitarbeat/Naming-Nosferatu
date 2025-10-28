/**
 * @module TournamentSetup/components/TournamentSidebar
 * @description Sidebar with tournament info, photo gallery, and name suggestions
 */
import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import { NameSuggestionSection } from "../index";
import TournamentInfo from "./TournamentInfo";
import PhotoGallery from "./PhotoGallery";
import styles from "../../TournamentSetup.module.css";

function TournamentSidebar({
  selectedNamesCount,
  availableNamesCount,
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
      <TournamentInfo
        selectedNamesCount={selectedNamesCount}
        availableNamesCount={availableNamesCount}
      />

      <Card
        className={styles.sidebarCard}
        padding="large"
        shadow="large"
        as="section"
        aria-labelledby="tournament-setup-overview"
      >
        <PhotoGallery
          galleryImages={galleryImages}
          showAllPhotos={showAllPhotos}
          onShowAllPhotosToggle={onShowAllPhotosToggle}
          onImageOpen={onImageOpen}
          isAdmin={isAdmin}
          userName={userName}
          onImagesUploaded={onImagesUploaded}
        />
      </Card>

      <Card
        className={styles.sidebarCard}
        padding="large"
        shadow="large"
        as="section"
        aria-label="Name suggestions"
      >
        <NameSuggestionSection />
      </Card>
    </aside>
  );
}

TournamentSidebar.propTypes = {
  selectedNamesCount: PropTypes.number.isRequired,
  availableNamesCount: PropTypes.number.isRequired,
  galleryImages: PropTypes.arrayOf(PropTypes.string).isRequired,
  showAllPhotos: PropTypes.bool.isRequired,
  onShowAllPhotosToggle: PropTypes.func.isRequired,
  onImageOpen: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  userName: PropTypes.string,
  onImagesUploaded: PropTypes.func.isRequired,
};

export default TournamentSidebar;

