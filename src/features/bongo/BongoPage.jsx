/**
 * @module BongoPage
 * @description Hidden page featuring the BongoCat component - only accessible via /bongo route
 *
 * NOTE: This page is intentionally hidden and has no navigation links.
 * Users must manually type "/bongo" in the URL to access this page.
 * This is a secret feature for cat lovers who discover the URL!
 */
import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import BongoCat from "../../shared/components/BongoCat/BongoCat";
import styles from "./BongoPage.module.css";

function BongoPage({ isLoggedIn, userName }) {
  const containerRef = useRef(null);

  // Add bongo-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add("bongo-page");
    document.documentElement.classList.add("bongo-page");

    // Remove class when component unmounts
    return () => {
      document.body.classList.remove("bongo-page");
      document.documentElement.classList.remove("bongo-page");
    };
  }, []);

  const handleBongo = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("🐱 Bongo cat says hello from the secret page!");
    }
  };

  return (
    <div className={styles.bongoPageWrapper}>
      {/* Background with overlay */}
      <div className={styles.backgroundContainer}>
        <div className={styles.animatedBackground} />
        <div className={styles.overlay} />
      </div>

      {/* Main content */}
      <div className={styles.contentContainer} ref={containerRef}>
        <div className={styles.header}>
          <h1 className={styles.title}>🐱 Secret Bongo Cat Page 🐱</h1>
          <p className={styles.subtitle}>
            You found the hidden bongo cat! This is a special page only
            accessible via the /bongo route.
          </p>
          {isLoggedIn && userName && (
            <p className={styles.greeting}>
              Welcome, {userName}! Enjoy the bongo cat! 🎉
            </p>
          )}
        </div>

        <div className={styles.bongoSection}>
          <h2 className={styles.sectionTitle}>Interactive Bongo Cat</h2>
          <p className={styles.instructions}>
            Click around the page to see the bongo cat in action!
          </p>

          {/* BongoCat component */}
          <div className={styles.bongoContainer}>
            <BongoCat
              size={0.6}
              color="#ff6b9d"
              onBongo={handleBongo}
              containerRef={containerRef}
            />
          </div>
        </div>

        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>About This Page</h3>
          <ul className={styles.infoList}>
            <li>This page is only accessible via the /bongo route</li>
            <li>It features the interactive BongoCat component</li>
            <li>The cat responds to user interactions and clicks</li>
            <li>It&apos;s a fun hidden feature for cat lovers!</li>
          </ul>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            🐾 Made with love for cat enthusiasts 🐾
          </p>
        </div>
      </div>
    </div>
  );
}

BongoPage.displayName = "BongoPage";

BongoPage.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  userName: PropTypes.string,
};

export default BongoPage;
