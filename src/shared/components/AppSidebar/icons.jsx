/**
 * @module AppSidebarIcons
 * @description Icon components for the AppSidebar
 */

import PropTypes from "prop-types";

/**
 * * Icon component with consistent sizing and styling
 */
function Icon({ name: _name, children, ...props }) {
  const defaultProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };

  return <svg {...defaultProps}>{children}</svg>;
}

Icon.propTypes = {
  name: PropTypes.string,
  children: PropTypes.node.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  viewBox: PropTypes.string,
};

// * Specific icon components
export const SunIcon = () => (
  <Icon name="sun">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Icon>
);

export const MoonIcon = () => (
  <Icon name="moon">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
);

export const LogoutIcon = () => (
  <Icon name="logout">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </Icon>
);

export const PhotosIcon = () => (
  <Icon name="photos">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Icon>
);

export const SuggestIcon = () => (
  <Icon name="suggest">
    <path d="M12 2v20M2 12h20" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const AnalysisIcon = () => (
  <Icon name="analysis">
    <path d="M3 3v18h18" />
    <circle cx="7" cy="7" r="2.5" fill="currentColor" opacity="0.2" />
    <circle cx="17" cy="7" r="2.5" fill="currentColor" opacity="0.2" />
    <circle cx="7" cy="17" r="2.5" fill="currentColor" opacity="0.2" />
    <circle cx="17" cy="17" r="2.5" fill="currentColor" opacity="0.2" />
    <path d="M9 7h6M9 17h6M7 9v6M17 9v6" strokeWidth="1.5" />
    <path d="M7 7l10 10M17 7l-10 10" strokeWidth="1.5" opacity="0.6" />
  </Icon>
);

export const HomeIcon = () => (
  <Icon name="home">
    <path d="m3 11 9-8 9 8" />
    <path d="M4 10.5V21h6v-6h4v6h6v-10.5" />
  </Icon>
);

export const ResultsIcon = () => (
  <Icon name="results">
    <path d="M8 21h8" />
    <path d="M12 21V9" />
    <path d="m7 4 5-2 5 2" />
    <path d="M6 7h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
    <path d="M10 13h4" />
  </Icon>
);
