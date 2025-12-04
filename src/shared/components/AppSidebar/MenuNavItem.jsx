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
 * @param {Function} props.onClick - Click handler that receives the item key
 */
export function MenuNavItem({ itemKey, icon: Icon, label, view, onClick }) {
  const isActive = view === itemKey.toLowerCase();

  const handleClick = (e) => {
    e.preventDefault();
    onClick(itemKey.toLowerCase());
  };

  return (
    <SidebarMenuItem key={itemKey}>
      <SidebarMenuButton asChild>
        <a
          href="#"
          onClick={handleClick}
          className={isActive ? "active" : ""}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon />
          <span>{label}</span>
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
};
