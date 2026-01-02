/**
 * @module Dashboard
 * @description Unified dashboard that shows both personal tournament results and global analytics.
 * Replaces separate Results and Analysis views with a single, comprehensive interface.
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Card from "../../shared/components/Card/Card";
import Toast from "../../shared/components/Toast/Toast";
import { useToast } from "../../shared/hooks/useAppHooks";
import styles from "./Dashboard.module.css";
import PersonalResults from "./components/PersonalResults";
import { AnalysisDashboard } from "../../shared/components/AnalysisDashboard/AnalysisDashboard";

/**
 * Unified Dashboard Component
 * @param {Object} props
 * @param {Object} props.personalRatings - Personal tournament ratings (if completed)
 * @param {Array} props.currentTournamentNames - Names from current tournament
 * @param {Array} props.voteHistory - Vote history for bracket
 * @param {Function} props.onStartNew - Start new tournament callback
 * @param {Function} props.onUpdateRatings - Update ratings callback
 * @param {string} props.userName - Current user name
 * @param {string} props.mode - "personal" | "global" | "both" (default: "both")
 */
function Dashboard({
  personalRatings,
  currentTournamentNames,
  voteHistory,
  onStartNew,
  onUpdateRatings,
  userName,
  mode = "both",
}) {
  // * Initialize view mode based on prop: "personal" shows personal, "global" shows global, "both" defaults to personal if data exists
  const [viewMode, setViewMode] = useState(() => {
    if (mode === "personal") return "personal";
    if (mode === "global") return "global";
    // * For "both" mode, default to personal if data exists, otherwise global
    const hasPersonalData =
      personalRatings && Object.keys(personalRatings).length > 0;
    return hasPersonalData ? "personal" : "global";
  });

  // * Sync viewMode with mode prop changes (e.g., when URL parameter changes)
  useEffect(() => {
    if (mode === "personal") {
      setViewMode("personal");
    } else if (mode === "global") {
      setViewMode("global");
    }
    // * For "both" mode, don't force change - let user toggle
  }, [mode]);

  const { toasts, removeToast } = useToast({
    maxToasts: 1,
    defaultDuration: 3000,
  });

  // * Check if user has personal tournament data
  const hasPersonalData =
    personalRatings && Object.keys(personalRatings).length > 0;

  // * Render view mode toggle
  const renderViewModeToggle = () => {
    if (mode !== "both") return null;

    return (
      <div className={styles.viewModeToggle}>
        <button
          type="button"
          className={`${styles.viewModeBtn} ${viewMode === "personal" ? styles.active : ""}`}
          onClick={() => setViewMode("personal")}
          disabled={!hasPersonalData}
        >
          🏆 My Results
        </button>
        <button
          type="button"
          className={`${styles.viewModeBtn} ${viewMode === "global" ? styles.active : ""}`}
          onClick={() => setViewMode("global")}
        >
          🌍 Global Leaderboard
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card
        as="header"
        className={styles.header}
        background="glass"
        padding="large"
        shadow="medium"
      >
        <h2 className={styles.title}>
          {viewMode === "personal"
            ? "My Tournament Results"
            : "Global Leaderboard"}
        </h2>
        <p className={styles.subtitle}>
          Welcome back, <span className={styles.userName}>{userName}</span>!
        </p>
        {renderViewModeToggle()}
      </Card>

      <div className={styles.content}>
        {viewMode === "personal" ? (
          <PersonalResults
            personalRatings={personalRatings}
            currentTournamentNames={currentTournamentNames}
            voteHistory={voteHistory}
            onStartNew={onStartNew}
            onUpdateRatings={onUpdateRatings}
            userName={userName}
          />
        ) : (
          <AnalysisDashboard
            userName={userName}
            showGlobalLeaderboard={true}
            defaultCollapsed={false}
          />
        )}
      </div>

      <Toast
        variant="container"
        toasts={toasts}
        removeToast={removeToast}
        position="bottom-right"
        maxToasts={1}
      />
    </div>
  );
}

Dashboard.displayName = "Dashboard";

Dashboard.propTypes = {
  personalRatings: PropTypes.object,
  currentTournamentNames: PropTypes.array,
  voteHistory: PropTypes.array,
  onStartNew: PropTypes.func.isRequired,
  onUpdateRatings: PropTypes.func,
  userName: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(["personal", "global", "both"]),
};

export default React.memo(Dashboard);
