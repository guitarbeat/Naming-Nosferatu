/**
 * @module ThemeToggleActionItem
 * @description Theme toggle action item with conditional icon rendering
 */

import PropTypes from 'prop-types';
import { useSidebar } from './BaseSidebar';
import { SunIcon, MoonIcon } from './icons';

/**
 * * Theme toggle action item with conditional icon
 */
export function ThemeToggleActionItem({ onClick, isLightTheme }) {
  const { collapsed } = useSidebar();

  const label = isLightTheme ? 'Dark Mode' : 'Light Mode';
  const ariaLabel = `Switch to ${isLightTheme ? 'dark' : 'light'} theme`;
  const title = collapsed ? label : undefined;

  return (
    <li className="sidebar-menu-item">
      <button
        type="button"
        onClick={onClick}
        className="sidebar-menu-button"
        aria-label={ariaLabel}
        title={title}
      >
        {isLightTheme ? <SunIcon /> : <MoonIcon />}
        <span>{label}</span>
      </button>
    </li>
  );
}

ThemeToggleActionItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  isLightTheme: PropTypes.bool.isRequired,
};

