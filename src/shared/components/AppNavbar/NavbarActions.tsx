/**
 * @module AppNavbar/NavbarActions
 * @description Action buttons (suggest, user, theme) component
 */

import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import ThemeSwitch from "../ThemeSwitch";
import { SuggestIcon, LogoutIcon } from "./icons";
import { UserDisplay } from "./UserDisplay";
import type { ThemePreference, ThemeType } from "./types";

interface NavbarActionsProps {
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  onOpenSuggestName?: () => void;
  themePreference: ThemePreference;
  currentTheme: ThemeType;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onThemeToggle?: () => void;
}

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "⚙️" },
] as const;

function getThemeIcon(preference: ThemePreference): string {
  const option = THEME_OPTIONS.find(opt => opt.key === preference);
  return option?.icon || "⚙️";
}

export function NavbarActions({
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onOpenSuggestName,
  themePreference,
  currentTheme,
  onThemePreferenceChange,
  onThemeToggle,
}: NavbarActionsProps) {
  const themeIcon = getThemeIcon(themePreference);

  return (
    <>
      <Button
        isIconOnly
        size="sm"
        radius="full"
        variant="light"
        className="app-navbar__action-button"
        data-icon-only="true"
        aria-label="Suggest a new cat name"
        title="Suggest a new cat name"
        onPress={onOpenSuggestName}
        isDisabled={!onOpenSuggestName}
      >
        <SuggestIcon />
      </Button>

      {isLoggedIn && userName && (
        <button
          type="button"
          className="app-navbar__user-button"
          onClick={onLogout}
          aria-label={`Log out ${userName}`}
          title="Log out"
        >
          <UserDisplay userName={userName} isAdmin={isAdmin} />
          <span className="app-navbar__logout-icon" aria-hidden>
            <LogoutIcon />
          </span>
        </button>
      )}

      {onThemeToggle ? (
        <ThemeSwitch currentTheme={currentTheme} onToggle={onThemeToggle} />
      ) : (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button
              isIconOnly
              size="sm"
              radius="full"
              variant="light"
              className="app-navbar__action-button"
              data-icon-only="true"
              aria-label={`Theme preference: ${themePreference}`}
            >
              {themeIcon}
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Theme selector" className="app-navbar__dropdown">
            {THEME_OPTIONS.map((option) => (
              <DropdownItem
                key={option.key}
                textValue={option.label}
                className="app-navbar__dropdown-item"
                data-active={themePreference === option.key}
                onPress={() => onThemePreferenceChange(option.key)}
              >
                {option.icon} {option.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      )}
    </>
  );
}
