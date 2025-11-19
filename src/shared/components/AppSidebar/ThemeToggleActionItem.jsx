/**
 * @module ThemeToggleActionItem
 * @description Theme toggle action item with conditional icon rendering
 */

import PropTypes from "prop-types";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import { SunIcon, MoonIcon } from "./icons";

/**
 * * Theme toggle action item with conditional icon
 */
export function ThemeToggleActionItem({ onClick, isLightTheme }) {
  const { collapsed } = useSidebar();

  const label = isLightTheme ? "Dark Mode" : "Light Mode";
  const ariaLabel = `Switch to ${isLightTheme ? "dark" : "light"} theme`;
  const title = collapsed ? label : undefined;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
        >
          {isLightTheme ? <SunIcon /> : <MoonIcon />}
          <span>{label}</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

ThemeToggleActionItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  isLightTheme: PropTypes.bool.isRequired,
};
