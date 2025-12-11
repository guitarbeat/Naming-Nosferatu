/**
 * @module AppNavbar/NavbarActions
 * @description Action buttons (suggest, user) component
 */

import { Button } from "@heroui/react";
import { SuggestIcon, LogoutIcon } from "./icons";
import { UserDisplay } from "./UserDisplay";

interface NavbarActionsProps {
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  onOpenSuggestName?: () => void;
}

export function NavbarActions({
  isLoggedIn,
  userName,
  isAdmin,
  onLogout,
  onOpenSuggestName,
}: NavbarActionsProps) {

  return (
    <>
      <Button
        size="sm"
        radius="full"
        variant="flat"
        className="app-navbar__action-button app-navbar__suggest-button"
        aria-label="Suggest a new cat name"
        title="Suggest a new cat name"
        onPress={onOpenSuggestName}
        isDisabled={!onOpenSuggestName}
        startContent={<SuggestIcon />}
      >
        Suggest
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
    </>
  );
}
