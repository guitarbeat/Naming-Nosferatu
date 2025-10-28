/**
 * @module NavbarSection
 * @description Wrapper component for navbar sections with consistent styling
 */

import PropTypes from 'prop-types';

/**
 * * Navbar section wrapper for grouping related items
 */
export function NavbarSection({ children, className = '', alignRight = false }) {
  const baseClass = alignRight ? 'navbar-section navbar-section--right' : 'navbar-section navbar-section--left';

  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
}

NavbarSection.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  alignRight: PropTypes.bool,
};

