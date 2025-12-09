/**
 * @module MenuActionItem
 * @description Reusable action item component for navbar menu
 */

import PropTypes from "prop-types";
import { NavbarMenuButton, NavbarMenuItem } from "../ui/navbar";

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
  className = "",
  ariaLabel,
  condition = true,
}) {
  if (!condition) {
    return null;
  }

  const buttonAriaLabel = ariaLabel || label;

  return (
    <NavbarMenuItem>
      <NavbarMenuButton asChild>
        <button
          type="button"
          onClick={onClick}
          className={className}
          aria-label={buttonAriaLabel}
        >
          <Icon />
          <span>{label}</span>
        </button>
      </NavbarMenuButton>
    </NavbarMenuItem>
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
