/**
 * @module UserInfo
 * @description User info component for the sidebar - styled like a menu item
 */

import React from "react";
import PropTypes from "prop-types";
import { useSidebar } from "../../ui/sidebar";
import { SidebarMenuButton, SidebarMenuItem } from "../../ui/sidebar";
import "../AppSidebar.css";

export function UserInfo({ userName, onClick, isAdmin = false }) {
  const { collapsed } = useSidebar();

  // * Truncate long usernames for display (max 20 chars)
  const MAX_DISPLAY_LENGTH = 20;
  const truncatedUserName =
    userName && userName.length > MAX_DISPLAY_LENGTH
      ? `${userName.substring(0, MAX_DISPLAY_LENGTH)}...`
      : userName;

  const displayText = collapsed ? "" : `Welcome, ${truncatedUserName}`;

  const ariaLabel = collapsed
    ? isAdmin
      ? `Admin User: ${userName}`
      : `User: ${userName}`
    : undefined;

  // * Always show full name in title for accessibility
  const title = collapsed
    ? isAdmin
      ? `Welcome, ${userName} (Admin)`
      : `Welcome, ${userName}`
    : `Welcome, ${userName}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <button
          type="button"
          className={`sidebar-user-menu-button ${isAdmin ? "sidebar-user-menu-button--admin" : ""}`}
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
        >
          <img
            className="sidebar-user-avatar"
            src="/assets/images/bby-cat.GIF"
            alt="User avatar"
          />
          {!collapsed && <span>{displayText}</span>}
          {isAdmin && collapsed && (
            <span className="sidebar-admin-indicator" aria-label="Admin">
              👑
            </span>
          )}
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

UserInfo.propTypes = {
  userName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};
