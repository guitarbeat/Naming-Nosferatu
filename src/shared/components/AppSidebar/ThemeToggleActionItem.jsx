/**
 * @module ThemeToggleActionItem
 * @description Accessible theme preference switcher with explicit options
 */

import PropTypes from "prop-types";
import { useId } from "react";
import { SidebarMenuItem } from "../ui/sidebar";
import { SunIcon, MoonIcon } from "./icons";

/**
 * * Accessible theme preference selector (light, dark, or system)
 */
export function ThemeToggleActionItem({
  onChange,
  themePreference,
  currentTheme,
}) {
  const groupId = useId();
  const options = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
    { value: "system", label: "System", icon: null },
  ];

  const statusLabel =
    themePreference === "system"
      ? `Following system preference (${currentTheme} right now)`
      : `Using ${themePreference} mode`;

  const handleSelect = (value) => {
    if (value === themePreference) return;
    onChange(value);
  };

  return (
    <SidebarMenuItem className="theme-toggle theme-toggle--compact">
      <div className="theme-toggle__header" id={`${groupId}-label`}>
        <span className="theme-toggle__title">Theme</span>
        <span className="theme-toggle__status" aria-live="polite">
          {statusLabel}
        </span>
      </div>
      <div
        className="theme-toggle__chips"
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
      >
        {options.map((option) => {
          const isSelected = themePreference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`theme-toggle__chip ${
                isSelected ? "theme-toggle__chip--active" : ""
              }`}
              onClick={() => handleSelect(option.value)}
              aria-pressed={isSelected}
              aria-label={option.label}
            >
              <span aria-hidden="true" className="theme-toggle__icon">
                {option.icon ?? (
                  <span className="theme-toggle__system-icon">A</span>
                )}
              </span>
              <span className="theme-toggle__chip-label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </SidebarMenuItem>
  );
}

ThemeToggleActionItem.propTypes = {
  onChange: PropTypes.func.isRequired,
  themePreference: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
};
