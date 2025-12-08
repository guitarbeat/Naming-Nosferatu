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

  return (
    <SidebarMenuItem className="theme-toggle">
      <fieldset
        className="theme-toggle__fieldset"
        aria-describedby={`${groupId}-desc`}
      >
        <legend id={`${groupId}-label`} className="theme-toggle__legend">
          Theme
        </legend>
        <p id={`${groupId}-desc`} className="sr-only">
          Choose light, dark, or follow your device setting. Your choice
          persists between visits.
        </p>
        <div
          className="theme-toggle__options"
          role="radiogroup"
          aria-labelledby={`${groupId}-label`}
        >
          {options.map((option) => {
            const isSelected = themePreference === option.value;
            const optionId = `${groupId}-${option.value}`;
            return (
              <label
                key={option.value}
                className={`theme-toggle__option ${
                  isSelected ? "theme-toggle__option--active" : ""
                }`}
                htmlFor={optionId}
              >
                <input
                  type="radio"
                  name={`${groupId}-theme`}
                  id={optionId}
                  value={option.value}
                  checked={isSelected}
                  onChange={(event) => onChange(event.target.value)}
                />
                <span aria-hidden="true" className="theme-toggle__icon">
                  {option.icon ?? (
                    <span className="theme-toggle__system-icon">A</span>
                  )}
                </span>
                <span className="theme-toggle__label-text">{option.label}</span>
              </label>
            );
          })}
        </div>
        <div className="theme-toggle__status" aria-live="polite">
          {statusLabel}
        </div>
      </fieldset>
    </SidebarMenuItem>
  );
}

ThemeToggleActionItem.propTypes = {
  onChange: PropTypes.func.isRequired,
  themePreference: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  currentTheme: PropTypes.oneOf(["light", "dark"]).isRequired,
};
