/**
 * @module Profile
 * @description Main profile component that orchestrates user statistics and name management.
 * Now includes comprehensive selection analytics and tournament insights.
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FILTER_OPTIONS } from '../../core/constants';

import ProfileNameList from './ProfileNameList';
import CatNameEditor from '../admin/CatNameEditor';
import { ProfileHeader } from './components/ProfileHeader';
import { Error } from '../../shared/components';
import { useProfileNotifications } from './hooks/useProfileNotifications';
import { useProfileUser } from './hooks/useProfileUser';
import { useProfileNames } from './hooks/useProfileNames';
import { useProfileStats } from './hooks/useProfileStats';
import { useProfileHighlights } from './hooks/useProfileHighlights';
import { useProfileNameOperations } from './hooks/useProfileNameOperations';
import styles from './Profile.module.css';

// * Main Profile Component
const Profile = ({ userName }) => {
  // * Notification functions
  const { showSuccess, showError, showToast } = useProfileNotifications();

  // * Filter state
  const [filterStatus, setFilterStatus] = useState(
    FILTER_OPTIONS.STATUS.ACTIVE
  );
  const [sortBy, setSortBy] = useState(FILTER_OPTIONS.SORT.RATING);
  const [sortOrder, setSortOrder] = useState(FILTER_OPTIONS.ORDER.DESC);
  const [selectionFilter, setSelectionFilter] = useState('all');
  const [filteredCount, setFilteredCount] = useState(0);

  // * User management
  const {
    isAdmin,
    activeUser,
    userFilter,
    setUserFilter,
    canManageActiveUser,
    userSelectOptions,
    availableUsers,
    userListLoading,
    userListError
  } = useProfileUser(userName);

  // * Names management
  const {
    allNames,
    setAllNames,
    ratingsLoading,
    ratingsError,
    hiddenNames,
    setHiddenNames,
    hasSupabaseClient,
    setHasSupabaseClient,
    fetchNames
  } = useProfileNames(activeUser);

  // * Statistics
  const {
    stats,
    statsLoading,
    selectionStats,
    fetchSelectionStats
  } = useProfileStats(activeUser);

  // * Highlights
  const highlights = useProfileHighlights(allNames);

  // * Name operations
  const {
    selectedNames,
    setSelectedNames,
    handleToggleVisibility,
    handleDelete,
    handleSelectionChange,
    handleBulkHide,
    handleBulkUnhide
  } = useProfileNameOperations(
    activeUser,
    canManageActiveUser,
    hiddenNames,
    setHiddenNames,
    setAllNames,
    fetchNames,
    fetchSelectionStats,
    showSuccess,
    showError,
    showToast
  );

  // * Reset selected names when active user changes
  React.useEffect(() => {
    setSelectedNames(new Set());
  }, [activeUser, setSelectedNames]);

  // * Handle filtered count change from ProfileNameList
  const handleFilteredCountChange = useCallback((count) => {
    setFilteredCount(count);
  }, []);

  // * Optional: Apply Filters button (filters are live; this is UX affordance)
  const handleApplyFilters = useCallback(() => {
    // No-op for now; state already applied. Kept for future server-side filter batching.
    setFilteredCount((c) => c);
  }, []);

  // * Handle error display
  if (ratingsError) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Profile</h2>
        <p>{ratingsError.message}</p>
        <button onClick={() => fetchNames(activeUser)}>Retry</button>
      </div>
    );
  }

  // * Handle case when no data is available (e.g., Supabase not configured)
  if (!ratingsLoading && allNames.length === 0 && !ratingsError) {
    return (
      <div className={styles.profileContainer}>
        <ProfileHeader
          activeUser={activeUser}
          userName={userName}
          isAdmin={isAdmin}
          userFilter={userFilter}
          setUserFilter={setUserFilter}
          userSelectOptions={userSelectOptions}
          userListLoading={userListLoading}
          userListError={userListError}
          allNames={allNames}
          selectedNames={selectedNames}
          handleSelectionChange={handleSelectionChange}
        />
        <div className={styles.noDataContainer}>
          <h2>No Data Available</h2>
          <p>
            {!hasSupabaseClient
              ? 'Database not configured. Please set up Supabase environment variables to view your profile data.'
              : 'No names found in your profile.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* * Cat Name Editor for Admin */}
      {canManageActiveUser && userName === 'aaron' && (
        <CatNameEditor userName={userName} />
      )}

      {/* * Header */}
      <ProfileHeader
        activeUser={activeUser}
        userName={userName}
        isAdmin={isAdmin}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        userSelectOptions={userSelectOptions}
        userListLoading={userListLoading}
        userListError={userListError}
        allNames={allNames}
        selectedNames={selectedNames}
        handleSelectionChange={handleSelectionChange}
      />

      <ProfileNameList
        names={allNames}
        ratings={{ userName: activeUser }}
        isLoading={ratingsLoading || statsLoading}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isAdmin={canManageActiveUser}
        onToggleVisibility={handleToggleVisibility}
        onDelete={handleDelete}
        onSelectionChange={handleSelectionChange}
        selectedNames={selectedNames}
        hiddenIds={hiddenNames}
        showAdminControls={canManageActiveUser}
        selectionFilter={selectionFilter}
        hideSelectAllButton={true}
        setSelectionFilter={setSelectionFilter}
        selectionStats={selectionStats}
        onBulkHide={handleBulkHide}
        onBulkUnhide={handleBulkUnhide}
        onFilteredCountChange={handleFilteredCountChange}
        onApplyFilters={handleApplyFilters}
        stats={stats}
        highlights={highlights}
        filteredCount={filteredCount}
        totalCount={allNames.length}
        showUserFilter={!isAdmin}
      />
    </div>
  );
};

Profile.propTypes = {
  userName: PropTypes.string.isRequired
};

// * Wrap Profile with error boundary
function ProfileWithErrorBoundary(props) {
  return (
    <Error variant="boundary">
      <Profile {...props} />
    </Error>
  );
}

export default ProfileWithErrorBoundary;
