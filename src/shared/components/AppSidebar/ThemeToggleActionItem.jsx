/**
 * @module ThemeToggleActionItem
 * @description Theme toggle action item with conditional icon rendering
 */

import PropTypes from "prop-types";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { SunIcon, MoonIcon } from "./icons";

/**
 * * Theme toggle action item with conditional icon
 */
export function ThemeToggleActionItem({ onClick, isLightTheme }) {
  const ariaLabel = `Switch to ${isLightTheme ? "dark" : "light"} theme`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          aria-pressed={isLightTheme}
          className={
            isLightTheme ? "theme-toggle--light" : "theme-toggle--dark"
          }
          title={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
        >
          {isLightTheme ? <SunIcon /> : <MoonIcon />}
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

ThemeToggleActionItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  isLightTheme: PropTypes.bool.isRequired,
};
