import React from "react";
import PropTypes from "prop-types";
import BongoCat from "../../shared/components/BongoCat/BongoCat";
import styles from "./BongoPage.module.css";

interface BongoPageProps {
  isLoggedIn: boolean;
  userName?: string;
}

const BongoPage: React.FC<BongoPageProps> = ({ isLoggedIn, userName }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Bongo Cat</h1>
        <div className={styles.catWrapper}>
          <BongoCat size={300} personality="playful" enableSounds={true} containerRef={null} />
        </div>
        {isLoggedIn && (
          <p className={styles.welcome}>
            Welcome back, {userName || "friend"}!
          </p>
        )}
      </div>
    </div>
  );
};

BongoPage.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  userName: PropTypes.string,
};

export default BongoPage;
