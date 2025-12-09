/**
 * @module UserDisplay
 * @description Minimal user display component for sidebar - shows username and admin status
 */

import PropTypes from "prop-types";
import "./UserDisplay.css";

/**
 * * Minimal user display component
 * @param {Object} props
 * @param {string} props.userName - User's name
 * @param {boolean} props.isAdmin - Whether user is admin
 */
export function UserDisplay({ userName, isAdmin = false }) {
  if (!userName) {
    return null;
  }

  // * Truncate long usernames for display (max 18 chars)
  const MAX_DISPLAY_LENGTH = 18;
  const truncatedUserName =
    userName && userName.length > MAX_DISPLAY_LENGTH
      ? `${userName.substring(0, MAX_DISPLAY_LENGTH)}...`
      : userName;

  return (
    <div className="navbar-user-display">
      <div className="navbar-user-display__content">
        <div className="navbar-user-display__text">
          <span className="navbar-user-display__name">{truncatedUserName}</span>
          {isAdmin && (
            <span
              className="navbar-user-display__admin-label"
              aria-label="Admin"
            >
              Admin
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

UserDisplay.propTypes = {
  userName: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool,
};
