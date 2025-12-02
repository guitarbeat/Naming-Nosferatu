/**
 * @module UserDisplay
 * @description Minimal user display component for sidebar - shows username and admin status
 */

import PropTypes from "prop-types";
import { useSidebar } from "../../ui/sidebar";
import "./UserDisplay.css";

/**
 * * Minimal user display component
 * @param {Object} props
 * @param {string} props.userName - User's name
 * @param {boolean} props.isAdmin - Whether user is admin
 */
export function UserDisplay({ userName, isAdmin = false }) {
  const { collapsed, toggleCollapsed } = useSidebar();

  if (!userName) {
    return null;
  }

  // * Truncate long usernames for display (max 18 chars when expanded)
  const MAX_DISPLAY_LENGTH = 18;
  const truncatedUserName =
    userName && userName.length > MAX_DISPLAY_LENGTH
      ? `${userName.substring(0, MAX_DISPLAY_LENGTH)}...`
      : userName;

  const handleClick = () => {
    // * Toggle navbar collapse on avatar/user display click
    toggleCollapsed();
  };

  return (
    <div className="sidebar-user-display" onClick={handleClick} style={{ cursor: "pointer" }}>
      <div className="sidebar-user-display__content">
        {collapsed ? (
          <div className="sidebar-user-display__icon" aria-label={userName}>
            <span className="sidebar-user-display__initial">
              {userName.charAt(0).toUpperCase()}
            </span>
            {isAdmin && (
              <span
                className="sidebar-user-display__admin-badge"
                aria-label="Admin"
              >
                👑
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="sidebar-user-display__text">
              <span className="sidebar-user-display__name">
                {truncatedUserName}
              </span>
              {isAdmin && (
                <span
                  className="sidebar-user-display__admin-label"
                  aria-label="Admin"
                >
                  Admin
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

UserDisplay.propTypes = {
  userName: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool,
};
