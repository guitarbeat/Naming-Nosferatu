/**
 * @module MenuActionItem
 * @description Reusable action item component for sidebar menu
 */

import PropTypes from 'prop-types';
import { useSidebar } from './BaseSidebar';

/**
 * * Reusable action item component
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icon component to render
 * @param {string} props.label - Button label
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - ARIA label for accessibility
 * @param {boolean} props.condition - Condition to show the item
 */
export function MenuActionItem({
  icon: Icon,
  label,
  onClick,
  className = '',
  ariaLabel,
  condition = true,
}) {
  const { collapsed } = useSidebar();

  if (!condition) {
    return null;
  }

  const buttonAriaLabel = ariaLabel || label;

  return (
    <li className="sidebar-menu-item">
      <button
        type="button"
        onClick={onClick}
        className={`sidebar-menu-button ${className}`}
        aria-label={buttonAriaLabel}
        title={collapsed ? label : undefined}
      >
        <Icon />
        <span>{label}</span>
      </button>
    </li>
  );
}

MenuActionItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  condition: PropTypes.bool,
};

