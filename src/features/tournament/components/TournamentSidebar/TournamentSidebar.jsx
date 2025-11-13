/**
 * @module TournamentSetup/components/TournamentSidebar
 * @description Sidebar with tournament info, photo gallery, and name suggestions
 */
import PropTypes from "prop-types";
import { Card } from "../../../../shared/components";
import { NameSuggestionSection } from "../index";
import TournamentInfo from "./TournamentInfo";
import styles from "../../TournamentSetup.module.css";

function TournamentSidebar({
  selectedNamesCount,
  availableNamesCount,
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
};

export default TournamentSidebar;
