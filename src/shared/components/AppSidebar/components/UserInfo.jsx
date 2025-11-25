/**
 * @module UserInfo
 * @description User profile navigation item for the sidebar - follows MenuNavItem pattern
 */

import PropTypes from "prop-types";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../../ui/sidebar";
import { ProfileIcon } from "../icons";

export function UserInfo({ userName, onClick, isAdmin = false, view }) {
  const { collapsed } = useSidebar();
  const isActive = view === "profile";

  const handleClick = (e) => {
    e.preventDefault();
    onClick();
  };

  // * Truncate long usernames for display (max 15 chars when expanded)
  const MAX_DISPLAY_LENGTH = 15;
  const truncatedUserName =
    userName && userName.length > MAX_DISPLAY_LENGTH
      ? `${userName.substring(0, MAX_DISPLAY_LENGTH)}...`
      : userName;

  const label = collapsed ? "" : truncatedUserName || "Profile";

  const ariaLabel = collapsed
    ? isAdmin
      ? `Profile: ${userName} (Admin)`
      : `Profile: ${userName}`
    : undefined;

  const title = collapsed
    ? isAdmin
      ? `${userName} (Admin)`
      : userName
    : undefined;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a
          href="#"
          onClick={handleClick}
          className={isActive ? "active" : ""}
          aria-current={isActive ? "page" : undefined}
          aria-label={ariaLabel}
          title={title}
          data-admin={isAdmin ? "true" : undefined}
        >
          <ProfileIcon />
          <span>{label}</span>
          {isAdmin && collapsed && (
            <span className="sidebar-admin-indicator" aria-label="Admin">
              👑
            </span>
          )}
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

UserInfo.propTypes = {
  userName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  view: PropTypes.string,
};
