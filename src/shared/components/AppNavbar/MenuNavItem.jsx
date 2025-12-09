/**
 * @module MenuNavItem
 * @description Reusable navigation item component for navbar menu
 */

import PropTypes from "prop-types";
import { NavbarMenuButton, NavbarMenuItem } from "../ui/navbar";

/**
 * * Reusable navigation item component
 * @param {Object} props
 * @param {string} props.itemKey - Unique key for the item
 * @param {React.Component} props.icon - Icon component to render
 * @param {string} props.label - Button label
 * @param {string} props.view - Current active view
 * @param {Function} props.onClick - Click handler that receives the item key or custom handler
 * @param {boolean} props.isActive - Whether the item is active (for custom handlers)
 */
export function MenuNavItem({
  itemKey,
  icon: Icon,
  label,
  view,
  onClick,
  href = "#",
  ariaLabel,
  isActive: customIsActive,
  ...rest
}) {
  const isActive =
    customIsActive !== undefined
      ? customIsActive
      : view === itemKey.toLowerCase();

  const handleClick = (e) => {
    // * Prevent full reloads while still allowing keyboard navigation
    e.preventDefault();
    if (typeof onClick === "function") {
      if (onClick.length > 0) {
        onClick(itemKey.toLowerCase());
      } else {
        onClick();
      }
    }
  };

  return (
    <NavbarMenuItem key={itemKey} data-active={isActive} {...rest}>
      <NavbarMenuButton asChild>
        <a
          href={href}
          onClick={handleClick}
          className={isActive ? "active" : ""}
          aria-current={isActive ? "page" : undefined}
          aria-label={ariaLabel || label}
          title={label}
          data-active={isActive}
        >
          <Icon />
          <span className="nav-item-label">{label}</span>
        </a>
      </NavbarMenuButton>
    </NavbarMenuItem>
  );
}

MenuNavItem.propTypes = {
  itemKey: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  href: PropTypes.string,
  ariaLabel: PropTypes.string,
  isActive: PropTypes.bool,
};
