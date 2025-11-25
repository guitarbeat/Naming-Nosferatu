/**
 * @module Profile
 * @description Main profile component with unified, minimal design.
 * Thin wrapper around NameManagementView with profile-specific extensions.
 */
import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { FILTER_OPTIONS } from "../../core/constants";
import {
  NameManagementView,
  useNameManagementContext,
  Button,
} from "../../shared/components";

import ProfileNameList from "./ProfileNameList";
import CatNameEditor from "../admin/CatNameEditor";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileBulkActions } from "./components/ProfileBulkActions";
import ProfileDashboard from "../../shared/components/ProfileDashboard/ProfileDashboard";
import { useProfileNotifications } from "./hooks/useProfileNotifications";
import { useProfileUser } from "./hooks/useProfileUser";
import { useProfileStats } from "./hooks/useProfileStats";
import { useProfileHighlights } from "./hooks/useProfileHighlights";
import { useProfileNameOperations } from "./hooks/useProfileNameOperations";
import styles from "./Profile.module.css";

// * Profile Header that uses NameManagementView context
function ProfileHeaderWithContext({
  activeUser,
  userName,
  isAdmin,
  userFilter,
  setUserFilter,
  userSelectOptions,
  userListLoading,
  userListError,
}) {
  const context = useNameManagementContext();
  // * Create handleSelectionChange using context's toggleNameById
  const handleSelectionChange = useCallback(
    (nameId, selected) => {
      context.toggleNameById(nameId, selected);
    },
    [context]
  );
  return (
    <ProfileHeader
      activeUser={activeUser}
      userName={userName}
      isAdmin={isAdmin}
      userFilter={userFilter}
      setUserFilter={setUserFilter}
      userSelectOptions={userSelectOptions}
      userListLoading={userListLoading}
      userListError={userListError}
      allNames={context.names}
      selectedNames={context.selectedNames}
      handleSelectionChange={handleSelectionChange}
    />
  );
}

ProfileHeaderWithContext.propTypes = {
  activeUser: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  userFilter: PropTypes.string.isRequired,
  setUserFilter: PropTypes.func.isRequired,
  userSelectOptions: PropTypes.array.isRequired,
  userListLoading: PropTypes.bool.isRequired,
  userListError: PropTypes.object,
};

// * Profile Dashboard that uses NameManagementView context
function ProfileDashboardWithContext({ stats, selectionStats }) {
  const context = useNameManagementContext();
  const highlights = useProfileHighlights(context.names);

  if (!stats) return null;

  return (
    <ProfileDashboard
      stats={stats}
      selectionStats={selectionStats}
      highlights={highlights}
    />
  );
}

ProfileDashboardWithContext.propTypes = {
  stats: PropTypes.object,
  selectionStats: PropTypes.object,
};

// * Profile Bulk Actions that uses NameManagementView context
function ProfileBulkActionsWithContext({
  canManageActiveUser,
  selectionStats,
  activeUser,
  fetchSelectionStats,
  showSuccess,
  showError,
  showToast,
}) {
  const context = useNameManagementContext();
  const selectedCount = context.selectedCount;
  const selectedNames = context.selectedNames;

  // * Create wrapper functions for useProfileNameOperations that use context
  const setHiddenNames = useCallback(
    (updater) => {
      context.setHiddenIds(updater);
    },
    [context]
  );

  const setAllNames = useCallback(
    (updater) => {
      context.setNames(updater);
    },
    [context]
  );

  const fetchNames = useCallback(
    (userName) => {
      context.refetch();
    },
    [context]
  );

  // * Name operations for bulk actions
  const { handleBulkHide, handleBulkUnhide } = useProfileNameOperations(
    activeUser,
    canManageActiveUser,
    context.hiddenIds,
    setHiddenNames,
    setAllNames,
    fetchNames,
    fetchSelectionStats,
    showSuccess,
    showError,
    showToast
  );

  // * Compute filtered names (simplified - just for checking if all visible are selected)
  // * We use the same filters from context to determine visible names
  const filteredAndSortedNames = useMemo(() => {
    if (!context.names || context.names.length === 0) return [];

    let filtered = [...context.names];
    const isNameHidden = (n) =>
      Boolean(n.isHidden) || context.hiddenIds.has(n.id);

    // * Apply status filter
    if (context.filterStatus === "active") {
      filtered = filtered.filter((name) => !isNameHidden(name));
    } else if (context.filterStatus === "hidden") {
      filtered = filtered.filter((name) => isNameHidden(name));
    }

    // * Apply user filter (simplified - just check if we need to filter)
    if (context.userFilter && context.userFilter !== "all") {
      const nameMatchesOwner = (name, owner) => {
        const nameOwner = name.owner ?? activeUser;
        return owner ? nameOwner === owner : false;
      };

      if (context.userFilter === "current") {
        filtered = filtered.filter((name) =>
          nameMatchesOwner(name, activeUser)
        );
      } else if (context.userFilter === "other") {
        filtered = filtered.filter((name) => {
          const nameOwner = name.owner ?? activeUser;
          return nameOwner && nameOwner !== activeUser;
        });
      } else {
        filtered = filtered.filter((name) =>
          nameMatchesOwner(name, context.userFilter)
        );
      }
    }

    // * Apply selection filter
    if (context.selectionFilter !== "all" && selectionStats) {
      switch (context.selectionFilter) {
        case "selected":
          filtered = filtered.filter((name) => {
            const selectionCount =
              selectionStats.nameSelectionCounts?.[name.id] || 0;
            return selectionCount > 0;
          });
          break;
        case "never_selected":
          filtered = filtered.filter((name) => {
            const selectionCount =
              selectionStats.nameSelectionCounts?.[name.id] || 0;
            return selectionCount === 0;
          });
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [
    context.names,
    context.hiddenIds,
    context.filterStatus,
    context.userFilter,
    context.selectionFilter,
    activeUser,
    selectionStats,
  ]);

  // * Check if all visible names are selected
  const allVisibleSelected =
    filteredAndSortedNames.length > 0 &&
    filteredAndSortedNames.every((name) => selectedNames.has(name.id));

  // * Handle select all/deselect all
  const handleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      // Deselect all
      filteredAndSortedNames.forEach((name) => {
        context.toggleNameById(name.id, false);
      });
    } else {
      // Select all visible
      filteredAndSortedNames.forEach((name) => {
        context.toggleNameById(name.id, true);
      });
    }
  }, [allVisibleSelected, filteredAndSortedNames, context]);

  if (!canManageActiveUser || filteredAndSortedNames.length === 0) {
    return null;
  }

  return (
    <ProfileBulkActions
      selectedCount={selectedCount}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleSelectAll}
      onBulkHide={handleBulkHide}
      onBulkUnhide={handleBulkUnhide}
      isAllSelected={allVisibleSelected}
      showActions={true}
    />
  );
}

ProfileBulkActionsWithContext.propTypes = {
  canManageActiveUser: PropTypes.bool.isRequired,
  selectionStats: PropTypes.object,
  activeUser: PropTypes.string.isRequired,
  fetchSelectionStats: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showToast: PropTypes.func.isRequired,
};

// * Profile-specific component that uses NameManagementView context
function ProfileNameGrid({
  activeUser,
  canManageActiveUser,
  stats,
  statsLoading,
  selectionStats,
  setFilteredCount,
  userSelectOptions,
  isAdmin,
  fetchSelectionStats,
  showSuccess,
  showError,
  showToast,
}) {
  const context = useNameManagementContext();
  const displayNames = context.names;

  // * Create wrapper functions for useProfileNameOperations that use context
  // * These functions update the context's data after operations
  const setHiddenNames = useCallback(
    (updater) => {
      // * Use context setter for optimistic updates
      context.setHiddenIds(updater);
    },
    [context]
  );

  const setAllNames = useCallback(
    (updater) => {
      // * Use context setter for optimistic updates
      context.setNames(updater);
    },
    [context]
  );

  const fetchNames = useCallback(
    (userName) => {
      // * Refetch from database to ensure consistency
      context.refetch();
    },
    [context]
  );

  // * Name operations - now called inside ProfileNameGrid with context access
  const {
    selectedNames: _selectedNamesFromOps,
    setSelectedNames,
    handleToggleVisibility,
    handleDelete,
    handleSelectionChange,
    handleBulkHide,
    handleBulkUnhide,
  } = useProfileNameOperations(
    activeUser,
    canManageActiveUser,
    context.hiddenIds,
    setHiddenNames,
    setAllNames,
    fetchNames,
    fetchSelectionStats,
    showSuccess,
    showError,
    showToast
  );

  // * Highlights need names - use context names
  const highlights = useProfileHighlights(displayNames);

  return (
    <ProfileNameList
      names={displayNames}
      ratings={{ userName: activeUser }}
      isLoading={statsLoading}
      filterStatus={context.filterStatus}
      setFilterStatus={context.setFilterStatus}
      userFilter={context.userFilter}
      setUserFilter={context.setUserFilter}
      sortBy={context.sortBy}
      setSortBy={(value) => {
        // Handle sortBy change - profile mode uses different sort options
        context.setSortBy(value);
      }}
      sortOrder={context.sortOrder}
      setSortOrder={context.setSortOrder}
      isAdmin={canManageActiveUser}
      onToggleVisibility={handleToggleVisibility}
      onDelete={handleDelete}
      onSelectionChange={handleSelectionChange}
      selectedNames={context.selectedNames}
      hiddenIds={context.hiddenIds}
      showAdminControls={canManageActiveUser}
      selectionFilter={context.selectionFilter}
      hideSelectAllButton={true}
      setSelectionFilter={context.setSelectionFilter}
      selectionStats={selectionStats}
      onFilteredCountChange={setFilteredCount}
      onApplyFilters={() => {}}
      filteredCount={0} // Will be updated by ProfileNameList
      totalCount={displayNames.length}
      showUserFilter={isAdmin}
      userSelectOptions={userSelectOptions}
    />
  );
}

ProfileNameGrid.propTypes = {
  activeUser: PropTypes.string.isRequired,
  canManageActiveUser: PropTypes.bool.isRequired,
  stats: PropTypes.object,
  statsLoading: PropTypes.bool.isRequired,
  selectionStats: PropTypes.object,
  setFilteredCount: PropTypes.func.isRequired,
  userSelectOptions: PropTypes.array.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  fetchSelectionStats: PropTypes.func.isRequired,
  showSuccess: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  showToast: PropTypes.func.isRequired,
};

// * Main Profile Component
const Profile = ({ userName }) => {
  // * Notification functions
  const { showSuccess, showError, showToast } = useProfileNotifications();

  const [filteredCount, setFilteredCount] = useState(0);

  // * User management
  const {
    isAdmin,
    activeUser,
    userFilter,
    setUserFilter,
    canManageActiveUser,
    userSelectOptions,
    userListLoading,
    userListError,
  } = useProfileUser(userName);

  // * Statistics
  const { stats, statsLoading, selectionStats, fetchSelectionStats } =
    useProfileStats(activeUser);

  return (
    <div className={styles.profileContainer}>
      {/* * Cat Name Editor for Admin */}
      {canManageActiveUser && userName === "aaron" && (
        <CatNameEditor userName={userName} />
      )}

      <NameManagementView
        mode="profile"
        userName={activeUser}
        profileProps={{
          isAdmin: canManageActiveUser,
          showUserFilter: isAdmin,
          userSelectOptions,
          hiddenIds: new Set(), // Will be updated from context
          stats,
          selectionStats,
          // Note: onToggleVisibility and onDelete are handled inside ProfileNameGrid extension
          // They're only needed if extensions.nameGrid is not provided (fallback NameGrid)
          onToggleVisibility: undefined,
          onDelete: undefined,
        }}
        extensions={{
          header: () => (
            <ProfileHeaderWithContext
              activeUser={activeUser}
              userName={userName}
              isAdmin={isAdmin}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              userSelectOptions={userSelectOptions}
              userListLoading={userListLoading}
              userListError={userListError}
            />
          ),
          dashboard: () => (
            <ProfileDashboardWithContext
              stats={stats}
              selectionStats={selectionStats}
            />
          ),
          bulkActions: () => (
            <ProfileBulkActionsWithContext
              canManageActiveUser={canManageActiveUser}
              selectionStats={selectionStats}
              activeUser={activeUser}
              fetchSelectionStats={fetchSelectionStats}
              showSuccess={showSuccess}
              showError={showError}
              showToast={showToast}
            />
          ),
          nameGrid: () => (
            <ProfileNameGrid
              activeUser={activeUser}
              canManageActiveUser={canManageActiveUser}
              stats={stats}
              statsLoading={statsLoading}
              selectionStats={selectionStats}
              setFilteredCount={setFilteredCount}
              userSelectOptions={userSelectOptions}
              isAdmin={isAdmin}
              fetchSelectionStats={fetchSelectionStats}
              showSuccess={showSuccess}
              showError={showError}
              showToast={showToast}
            />
          ),
        }}
      />
    </div>
  );
};

Profile.propTypes = {
  userName: PropTypes.string.isRequired,
};

export default Profile;
