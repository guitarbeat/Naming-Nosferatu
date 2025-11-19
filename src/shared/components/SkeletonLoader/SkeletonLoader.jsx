/**
 * @module SkeletonLoader
 * @description Simple skeleton loading component for placeholder content
 */

import React from "react";
import PropTypes from "prop-types";
import styles from "./SkeletonLoader.module.css";

/**
 * SkeletonLoader component for displaying loading placeholders
 * @param {Object} props - Component props
 * @param {number} props.width - Width of the skeleton (default: 100%)
 * @param {number} props.height - Height of the skeleton (default: 20px)
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} The skeleton loader component
 */
const SkeletonLoader = ({ width = "100%", height = 20, className = "" }) => {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      role="presentation"
      aria-hidden="true"
    />
  );
};

SkeletonLoader.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
};

export default SkeletonLoader;
