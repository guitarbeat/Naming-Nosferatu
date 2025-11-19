/**
 * @module ProfileHeader
 * @description Header component for the profile page.
 */

import React from "react";
import PropTypes from "prop-types";
import { Select, Button } from "../../../shared/components";
import styles from "../Profile.module.css";

/**
 * * Profile header component
 * @param {Object} props - Component props
 * @param {string} props.activeUser - Active user name
 * @param {string} props.userName - Current user name
 * @param {boolean} props.isAdmin - Whether user is admin
 * @param {string} props.userFilter - Current user filter value
 * @param {Function} props.setUserFilter - Function to set user filter
 * @param {Array} props.userSelectOptions - Options for user select dropdown
 * @param {boolean} props.userListLoading - Whether user list is loading
 * @param {Object} props.userListError - User list error
 * @param {Array} props.allNames - All names array
 * @param {Set} props.selectedNames - Set of selected name IDs
 * @param {Function} props.handleSelectionChange - Handler for selection changes
 */
export function ProfileHeader({
  activeUser,
  userName,
  isAdmin,
  userFilter,
  setUserFilter,
  userSelectOptions,
  userListLoading,
  userListError,
  allNames,
  selectedNames,
  handleSelectionChange,
}) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Profile: {activeUser || userName}</h1>
      {isAdmin && (
        <div className={styles.headerActions}>
          <div className={styles.userSwitcher}>
            <label
              htmlFor="profile-user-select"
              className={styles.userSwitcherLabel}
            >
              View user
            </label>
            <Select
              id="profile-user-select"
              name="profile-user-select"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              options={userSelectOptions}
              disabled={userListLoading}
              className={styles.userSwitcherSelect}
            />
            {userListLoading && (
              <span className={styles.userSwitcherHelper}>Loading users…</span>
            )}
            {userListError && (
              <span className={styles.userSwitcherError}>
                Unable to load users
              </span>
            )}
            {activeUser && activeUser !== userName && (
              <span className={styles.viewingNote}>
                Viewing data for {activeUser}
              </span>
            )}
          </div>
          {allNames.length > 0 && (
            <Button
              onClick={() => {
                const allSelected = allNames.every((n) =>
                  selectedNames.has(n.id),
                );
                if (allSelected) {
                  allNames.forEach((n) => handleSelectionChange(n.id, false));
                } else {
                  allNames.forEach((n) => handleSelectionChange(n.id, true));
                }
              }}
              variant="secondary"
              size="small"
              title={
                allNames.every((n) => selectedNames.has(n.id))
                  ? "Deselect All"
                  : "Select All"
              }
            >
              {allNames.every((n) => selectedNames.has(n.id))
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

ProfileHeader.propTypes = {
  activeUser: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  userFilter: PropTypes.string.isRequired,
  setUserFilter: PropTypes.func.isRequired,
  userSelectOptions: PropTypes.array.isRequired,
  userListLoading: PropTypes.bool.isRequired,
  userListError: PropTypes.object,
  allNames: PropTypes.array.isRequired,
  selectedNames: PropTypes.instanceOf(Set).isRequired,
  handleSelectionChange: PropTypes.func.isRequired,
};
