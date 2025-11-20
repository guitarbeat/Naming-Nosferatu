/**
 * @module UserInfo
 * @description User info component for the sidebar
 */

import React from "react";
import PropTypes from "prop-types";
import { UserIcon } from "../icons";
import styles from "../AppSidebar.css";

export function UserInfo({ userName, onClick }) {
  return (
    <button className="sidebar-user-info" onClick={onClick}>
      <div className="sidebar-user-greeting">
        <img
          className="avatar"
          src="/assets/images/bby-cat.GIF"
          alt="A cat licking its tongue"
        />
        <span>Welcome, {userName}</span>
      </div>
    </button>
  );
}

UserInfo.propTypes = {
  userName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
