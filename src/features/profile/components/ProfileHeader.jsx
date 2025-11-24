/**
 * @module ProfileHeader
 * @description Minimal, cohesive header component for the profile page.
 * Uses shared design system components and standardized spacing/typography.
 */

import React from "react";
import PropTypes from "prop-types";
import { Select, Button, Card } from "../../../shared/components";
import styles from "../Profile.refactored.module.css";

/**
 * Profile header component - displays user info and admin controls
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
  const allSelected = allNames.every((n) => selectedNames.has(n.id));

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        {activeUser || userName}
      </h1>
      
      {isAdmin && (
        <div className={styles.headerActions}>
          <div className={styles.userSwitcher}>
            <label
              htmlFor="profile-user-select"
              className={styles.userSwitcherLabel}
            >
              View User
            </label>
            <Select
              id="profile-user-select"
              name="profile-user-select"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              options={userSelectOptions}
              disabled={userListLoading}
              className={styles.userSwitcherSelect}
              aria-label="Select user to view"
            />
            {userListLoading && (
              <span className={styles.userSwitcherHelper}>Loading users…</span>
            )}
            {userListError && (
              <span className={styles.userSwitcherError} role="alert">
                Unable to load users
              </span>
            )}
            {activeUser && activeUser !== userName && (
              <span className={styles.viewingNote}>
                Viewing {activeUser}&apos;s data
              </span>
            )}
          </div>
          
          {allNames.length > 0 && (
            <Button
              onClick={() => {
                if (allSelected) {
                  allNames.forEach((n) => handleSelectionChange(n.id, false));
                } else {
                  allNames.forEach((n) => handleSelectionChange(n.id, true));
                }
              }}
              variant="secondary"
              size="small"
              aria-label={allSelected ? "Deselect all names" : "Select all names"}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>
      )}
    </header>
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
