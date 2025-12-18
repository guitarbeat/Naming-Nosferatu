/**
 * @module NoiseBackground
 * @description Component that renders a subtle SVG noise texture background
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./NoiseBackground.module.css";

/**
 * NoiseBackground Component
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.opacity=0.05] - Opacity of the noise texture
 */
function NoiseBackground({ className = "", opacity = 0.05 }) {
  return (
    <div className={`${styles.noiseCanvas} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-filter)" />
      </svg>
      <style>{`
        .${styles.noiseCanvas} svg {
          opacity: ${opacity};
        }
      `}</style>
    </div>
  );
}

NoiseBackground.propTypes = {
  className: PropTypes.string,
  opacity: PropTypes.number,
};

export default NoiseBackground;
