/**
 * @module Dashboard
 * @description Unified dashboard that shows both personal tournament results and global analytics.
 * Replaces separate Results and Analysis views with a single, comprehensive interface.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import RankingAdjustment from "./RankingAdjustment";
import Bracket from "../../shared/components/Bracket/Bracket";
import CalendarButton from "../../shared/components/CalendarButton/CalendarButton";
import StartTournamentButton from "../../shared/components/StartTournamentButton/StartTournamentButton";
import StatsCard from "../../shared/components/StatsCard/StatsCard";
import { Card, Toast } from "@components";
import { BumpChart } from "../../shared/components/BumpChart";
import { PerformanceBadges } from "../../shared/components/PerformanceBadge";
import {
  CollapsibleHeader,
  CollapsibleContent,
} from "../../shared/components/CollapsibleHeader";
import { catNamesAPI } from "../../shared/services/supabase/api";
import { devError } from "../../shared/utils/logger";
import { useToast } from "../../shared/hooks/useToast";
import { calculateBracketRound } from "../../shared/utils/tournamentUtils";
import { getRankDisplay } from "../../shared/utils/displayUtils";
import { calculatePercentile } from "../../shared/utils/metricsUtils";
import styles from "./Dashboard.module.css";

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
  const [dataView, setDataView] = useState("table"); // "table" | "chart" | "insights"
  const [isLoading, setIsLoading] = useState(false);

  // * Personal tournament data
  const [personalRankings, setPersonalRankings] = useState([]);

  // * Global analytics data
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [rankingHistory, setRankingHistory] = useState({
    data: [],
    timeLabels: [],
  });
  const [sortField, setSortField] = useState("rating");
  const [sortDirection, setSortDirection] = useState("desc");

  const { toasts, showToast, removeToast } = useToast({
    maxToasts: 1,
    defaultDuration: 3000,
  });

  // * Check if user has personal tournament data
  const hasPersonalData =
    personalRatings && Object.keys(personalRatings).length > 0;
  const hasTournamentNames =
    currentTournamentNames && currentTournamentNames.length > 0;

  // * Process personal tournament rankings
  const tournamentNameSet = useMemo(
    () => new Set(currentTournamentNames?.map((n) => n.name) || []),
    [currentTournamentNames],
  );

  const nameToIdMap = useMemo(
    () =>
      new Map(
        (currentTournamentNames || [])
          .filter((name) => name?.name)
          .map(({ id, name }) => [name, id]),
      ),
    [currentTournamentNames],
  );

  useEffect(() => {
    if (!hasPersonalData || !hasTournamentNames) {
      setPersonalRankings([]);
      return;
    }

    try {
      const rankings = Object.entries(personalRatings || {})
        .filter(([name]) => tournamentNameSet.has(name))
        .map(([name, rating]) => ({
          id: nameToIdMap.get(name),
          name,
          rating: Math.round(
            typeof rating === "number" ? rating : rating?.rating || 1500,
          ),
          wins: typeof rating === "object" ? rating.wins || 0 : 0,
          losses: typeof rating === "object" ? rating.losses || 0 : 0,
          change: 0,
        }))
        .sort((a, b) => b.rating - a.rating);

      setPersonalRankings(rankings);
    } catch (error) {
      devError("Error processing personal rankings:", error);
      setPersonalRankings([]);
    }
  }, [
    personalRatings,
    tournamentNameSet,
    nameToIdMap,
    hasPersonalData,
    hasTournamentNames,
  ]);

  // * Fetch global analytics data
  useEffect(() => {
    const fetchGlobalData = async () => {
      setIsLoading(true);
      try {
        const [leaderboard, history] = await Promise.all([
          catNamesAPI.getLeaderboard(null),
          catNamesAPI.getRankingHistory(10, 7, { dateFilter: "all" }),
        ]);

        setGlobalLeaderboard(leaderboard || []);
        setRankingHistory(history || { data: [], timeLabels: [] });
      } catch (error) {
        devError("Error fetching global data:", error);
        showToast({
          message: "Failed to load global data",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (viewMode === "global" || mode === "both") {
      fetchGlobalData();
    }
  }, [viewMode, mode, showToast]);

  // * Calculate bracket matches for personal tournament
  const bracketMatches = useMemo(() => {
    if (!voteHistory || !voteHistory.length || !hasTournamentNames) {
      return [];
    }

    const namesCount = currentTournamentNames?.length || 0;
    return voteHistory
      .filter(
        (vote) =>
          vote?.match?.left?.name &&
          vote?.match?.right?.name &&
          tournamentNameSet.has(vote.match.left.name) &&
          tournamentNameSet.has(vote.match.right.name),
      )
      .map((vote, index) => {
        const leftOutcome = vote?.match?.left?.outcome;
        const rightOutcome = vote?.match?.right?.outcome;
        let winner;

        if (leftOutcome || rightOutcome) {
          const leftWin = leftOutcome === "win";
          const rightWin = rightOutcome === "win";
          if (leftWin && rightWin) winner = 0;
          else if (leftWin && !rightWin) winner = -1;
          else if (!leftWin && rightWin) winner = 1;
          else winner = 2;
        } else if (typeof vote.result === "number") {
          if (vote.result === -1) winner = -1;
          else if (vote.result === 1) winner = 1;
          else if (vote.result === 0.5) winner = 0;
          else if (vote.result === 0) winner = 2;
          else if (vote.result < -0.1) winner = -1;
          else if (vote.result > 0.1) winner = 1;
          else if (Math.abs(vote.result) <= 0.1) winner = 0;
          else winner = 2;
        } else {
          winner = 2;
        }

        const matchNumber = vote?.matchNumber ?? index + 1;
        const calculatedRound = calculateBracketRound(namesCount, matchNumber);

        return {
          id: matchNumber,
          round: calculatedRound,
          name1: vote?.match?.left?.name || "Unknown",
          name2: vote?.match?.right?.name || "Unknown",
          winner,
        };
      });
  }, [
    voteHistory,
    tournamentNameSet,
    currentTournamentNames,
    hasTournamentNames,
  ]);

  // * Handle saving adjusted personal rankings
  const handleSaveAdjustments = useCallback(
    async (adjustedRankings) => {
      try {
        setIsLoading(true);

        const updatedRankings = adjustedRankings.map((ranking) => {
          const oldRanking = personalRankings.find(
            (r) => r.name === ranking.name,
          );
          return {
            ...ranking,
            change: oldRanking ? ranking.rating - oldRanking.rating : 0,
          };
        });

        const newRatings = updatedRankings.map(({ name, rating }) => {
          const existingRating = personalRatings[name];
          return {
            name,
            rating: Math.round(rating),
            wins: existingRating?.wins || 0,
            losses: existingRating?.losses || 0,
          };
        });

        await onUpdateRatings(newRatings);
        setPersonalRankings(updatedRankings);

        showToast({
          message: "Rankings updated successfully!",
          type: "success",
        });
      } catch (error) {
        devError("Failed to update rankings:", error);
        showToast({
          message: "Failed to update rankings. Please try again.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [personalRankings, personalRatings, onUpdateRatings, showToast],
  );

  // * Handle sorting
  const handleSort = useCallback((field) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("desc");
      return field;
    });
  }, []);

  // * Sort rankings
  const sortedGlobalLeaderboard = useMemo(() => {
    if (!globalLeaderboard.length) return [];

    const sorted = [...globalLeaderboard];
    sorted.sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return bVal > aVal ? 1 : -1;
    });

    return sorted;
  }, [globalLeaderboard, sortField, sortDirection]);

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

  // * Render data view toggle (for global mode)
  const renderDataViewToggle = () => {
    if (viewMode !== "global") return null;

    return (
      <div className={styles.dataViewToggle}>
        <button
          type="button"
          className={`${styles.dataViewBtn} ${dataView === "table" ? styles.active : ""}`}
          onClick={() => setDataView("table")}
        >
          📋 Table
        </button>
        <button
          type="button"
          className={`${styles.dataViewBtn} ${dataView === "chart" ? styles.active : ""}`}
          onClick={() => setDataView("chart")}
        >
          📊 Chart
        </button>
      </div>
    );
  };

  // * Render personal results view
  const renderPersonalView = () => {
    if (!hasPersonalData) {
      return (
        <div className={styles.emptyState}>
          <p>Complete a tournament to see your personal results here!</p>
        </div>
      );
    }

    return (
      <>
        {personalRankings.length > 0 && (
          <div className={styles.statsGrid}>
            <StatsCard
              title="Your Winner"
              value={personalRankings[0]?.name || "-"}
              emoji="🏆"
              variant="primary"
              className={styles.statCard}
            />
            <StatsCard
              title="Rating"
              value={personalRankings[0]?.rating || 1500}
              emoji="⭐"
              variant="secondary"
              className={styles.statCard}
            />
            <StatsCard
              title="Total Names"
              value={personalRankings.length}
              emoji="📝"
              variant="tertiary"
              className={styles.statCard}
            />
          </div>
        )}

        <RankingAdjustment
          rankings={personalRankings}
          onSave={handleSaveAdjustments}
          onCancel={onStartNew}
        />

        {bracketMatches.length > 0 && (
          <CollapsibleHeader
            title="Tournament Bracket"
            defaultCollapsed={false}
            className={styles.bracketSection}
          >
            <CollapsibleContent>
              <Bracket matches={bracketMatches} />
            </CollapsibleContent>
          </CollapsibleHeader>
        )}
      </>
    );
  };

  // * Render global leaderboard view
  const renderGlobalView = () => {
    if (isLoading) {
      return <div className={styles.loading}>Loading global data...</div>;
    }

    if (!sortedGlobalLeaderboard.length) {
      return (
        <div className={styles.emptyState}>
          <p>No global data available yet.</p>
        </div>
      );
    }

    if (dataView === "chart") {
      return (
        <div className={styles.chartContainer}>
          <BumpChart
            data={rankingHistory.data}
            timeLabels={rankingHistory.timeLabels}
            maxDisplayed={10}
            height={400}
            showLegend={true}
          />
        </div>
      );
    }

    return (
      <div className={styles.tableContainer}>
        <table className={styles.leaderboardTable}>
          <thead>
            <tr>
              <th>Rank</th>
              <th
                onClick={() => handleSort("name")}
                style={{ cursor: "pointer" }}
              >
                Name{" "}
                {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("rating")}
                style={{ cursor: "pointer" }}
              >
                Rating{" "}
                {sortField === "rating" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("wins")}
                style={{ cursor: "pointer" }}
              >
                Wins{" "}
                {sortField === "wins" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th>Badges</th>
            </tr>
          </thead>
          <tbody>
            {sortedGlobalLeaderboard.map((name, index) => (
              <tr key={name.id || index}>
                <td>{getRankDisplay(index + 1)}</td>
                <td>{name.name}</td>
                <td>{name.rating || 1500}</td>
                <td>{name.wins || 0}</td>
                <td>
                  <PerformanceBadges
                    name={name}
                    percentile={calculatePercentile(
                      index,
                      sortedGlobalLeaderboard.length,
                    )}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        {renderDataViewToggle()}
        {viewMode === "personal" ? renderPersonalView() : renderGlobalView()}

        <div className={styles.actions}>
          <StartTournamentButton
            onClick={onStartNew}
            className={styles.startNewButton}
          >
            Start New Tournament
          </StartTournamentButton>
          {hasPersonalData && (
            <CalendarButton rankings={personalRankings} userName={userName} />
          )}
        </div>
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
