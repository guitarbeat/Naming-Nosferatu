/**
 * @module UserInfo
 * @description User info component for the sidebar - styled like a menu item
 */

import React from "react";
import PropTypes from "prop-types";
import { useSidebar } from "../../ui/sidebar";
import { SidebarMenuButton, SidebarMenuItem } from "../../ui/sidebar";
import "../AppSidebar.css";

export function UserInfo({ userName, onClick }) {
  const { collapsed } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <button
          type="button"
          className="sidebar-user-menu-button"
          onClick={onClick}
          aria-label={collapsed ? `User: ${userName}` : undefined}
          title={collapsed ? `Welcome, ${userName}` : undefined}
        >
          <img
            className="sidebar-user-avatar"
            src="/assets/images/bby-cat.GIF"
            alt="User avatar"
          />
          <span>{collapsed ? "" : `Welcome, ${userName}`}</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

UserInfo.propTypes = {
  userName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
