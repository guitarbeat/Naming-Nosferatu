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
    width: "22",
    height: "22",
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
    <path d="M4 8a3 3 0 0 1 3-3h2l1.2-1.6a1 1 0 0 1 .8-.4h4a1 1 0 0 1 .8.4L18 5h2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
    <circle cx="12" cy="11" r="2.6" />
    <path d="m4 16 4.5-4 2.5 2.5L14 11l6 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 7.5h.01" strokeWidth="2.4" strokeLinecap="round" />
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
    <path d="M4 20V6" />
    <path d="M20 20H4" />
    <path d="m6 14 3.5-4 3 3 5.5-6" />
    <circle cx="9.5" cy="10" r="1.6" fill="currentColor" opacity="0.35" />
    <circle cx="17.5" cy="7" r="1.6" fill="currentColor" opacity="0.35" />
    <path d="M18 4v3h3" />
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
    <path d="M10 21v-4.5" />
    <path d="M14 21v-4.5" />
    <path d="M6 5h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6Z" />
    <path d="M9 5V3h6v2" />
    <path d="M6 9H3V6h3" />
    <path d="M18 6h3v3h-3" />
    <path d="m9 11 3-2 3 2" />
  </Icon>
);

export const SystemIcon = () => (
  <Icon name="system">
    <rect width="14" height="8" x="5" y="2" rx="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" />
    <path d="M6 18h2" />
    <path d="M12 18h6" />
  </Icon>
);
