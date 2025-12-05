/**
 * @module MenuNavItem
 * @description Reusable navigation item component for sidebar menu
 */

import PropTypes from "prop-types";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

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
  isActive: customIsActive,
  ...rest
}) {
  const isActive =
    customIsActive !== undefined
      ? customIsActive
      : view === itemKey.toLowerCase();

  const handleClick = (e) => {
    e.preventDefault();
    // * If onClick is provided directly, use it; otherwise use default behavior
    if (onClick && typeof onClick === "function") {
      onClick();
    } else {
      onClick(itemKey.toLowerCase());
    }
  };

  return (
    <SidebarMenuItem key={itemKey} data-active={isActive} {...rest}>
      <SidebarMenuButton asChild>
        <a
          href="#"
          onClick={handleClick}
          className={isActive ? "active" : ""}
          aria-current={isActive ? "page" : undefined}
          title={label}
          data-active={isActive}
        >
          <Icon />
          <span className="nav-item-label">{label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

MenuNavItem.propTypes = {
  itemKey: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
};
