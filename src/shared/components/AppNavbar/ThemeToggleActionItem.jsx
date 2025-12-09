/**
 * @module ThemeToggleActionItem
 * @description Three-way toggle for theme preferences (light → dark → system → light)
 */

import PropTypes from "prop-types";
import { NavbarMenuItem, NavbarMenuButton } from "../ui/navbar";
import { SunIcon, MoonIcon, SystemIcon } from "./icons";

/**
 * * Three-way theme toggle that cycles through light, dark, and system preferences
 */
export function ThemeToggleActionItem({
  onChange,
  themePreference,
  currentTheme,
}) {
  const themes = [
    { value: "light", label: "Light", icon: SunIcon },
    { value: "dark", label: "Dark", icon: MoonIcon },
    { value: "system", label: "System", icon: SystemIcon },
  ];

  const currentIndex = themes.findIndex(
    (theme) => theme.value === themePreference
  );
  const currentThemeData = themes[currentIndex];

  const statusLabel =
    themePreference === "system"
      ? `System (${currentTheme})`
      : currentThemeData.label;

  const handleToggle = () => {
    const nextIndex = (currentIndex + 1) % themes.length;
    onChange(themes[nextIndex].value);
  };

  const IconComponent = currentThemeData.icon;

  return (
    <NavbarMenuItem>
      <NavbarMenuButton
        asChild
        onClick={handleToggle}
        aria-label={`Switch theme. Currently ${statusLabel}. Next: ${themes[(currentIndex + 1) % themes.length].label}`}
        title={`Theme: ${statusLabel} → ${themes[(currentIndex + 1) % themes.length].label}`}
      >
        <button type="button" className="theme-toggle-button">
          <IconComponent />
          <span className="theme-toggle-label">{statusLabel}</span>
        </button>
      </NavbarMenuButton>
    </NavbarMenuItem>
  );
}

ThemeToggleActionItem.propTypes = {
  onChange: PropTypes.func.isRequired,
  themePreference: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
};
