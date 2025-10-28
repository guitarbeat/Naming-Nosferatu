import React from "react";
import PropTypes from "prop-types";
import Card from "../../shared/components/Card";
import StatsCard from "../../shared/components/StatsCard/StatsCard";
import ProfileHighlights from "../../shared/components/ProfileHighlights/ProfileHighlights";
import styles from "./ProfileStats.module.css";

const STAT_CARD_SECTIONS = {
  base: [
    {
      key: "total_ratings",
      title: "Names Rated",
      emoji: "📊",
      variant: "primary",
      getValue: ({ total_ratings = 0 }) => total_ratings,
    },
    {
      key: "win_rate",
      title: "Win Rate",
      emoji: "🏆",
      variant: "success",
      getValue: ({ win_rate = 0 }) => `${win_rate}%`,
    },
    {
      key: "avg_rating",
      title: "Average Rating",
      emoji: "⭐",
      variant: "warning",
      getValue: ({ avg_rating = 0 }) => Math.round(avg_rating),
    },
    {
      key: "total_wins",
      title: "Total Wins",
      emoji: "✅",
      variant: "info",
      getValue: ({ total_wins = 0 }) => total_wins,
    },
    {
      key: "total_losses",
      title: "Total Losses",
      emoji: "❌",
      variant: "secondary",
      getValue: ({ total_losses = 0 }) => total_losses,
    },
    {
      key: "activeNames",
      title: "Active Names",
      emoji: "👁️",
      variant: "default",
      getValue: ({ total_ratings = 0, hidden_count = 0 }) =>
        total_ratings - hidden_count,
    },
  ],
  selection: [
    {
      key: "totalSelections",
      title: "Tournament Selections",
      emoji: "🎲",
      variant: "primary",
      getValue: ({ totalSelections = 0 }) => totalSelections,
    },
    {
      key: "totalTournaments",
      title: "Tournaments Created",
      emoji: "🏁",
      variant: "success",
      getValue: ({ totalTournaments = 0 }) => totalTournaments,
    },
    {
      key: "mostSelectedName",
      title: "Most Selected",
      emoji: "❤️",
      variant: "danger",
      getValue: ({ mostSelectedName = "N/A" }) => mostSelectedName,
    },
    {
      key: "currentStreak",
      title: "Selection Streak",
      emoji: "🔥",
      variant: "info",
      getValue: ({ currentStreak = 0 }) => currentStreak,
    },
  ],
};

const SELECTION_INSIGHT_DEFINITIONS = [
  {
    key: "selectionPattern",
    icon: "📅",
    title: "Selection Pattern",
    fallback: "Analyzing your patterns...",
  },
  {
    key: "preferredCategories",
    icon: "🎯",
    title: "Preferred Categories",
    fallback: "Discovering your preferences...",
  },
  {
    key: "improvementTip",
    icon: "🚀",
    title: "Improvement Tip",
    fallback: "Optimizing your selections...",
  },
];

const buildStatCards = (data, definitions = []) => {
  if (!data) return [];

  return definitions
    .filter(({ isVisible }) => (isVisible ? isVisible(data) : true))
    .map(({ key, title, emoji, variant, getValue }) => ({
      key,
      title,
      emoji,
      variant,
      value: typeof getValue === "function" ? getValue(data) : data[key],
    }));
};

const buildSelectionInsights = (insights) => {
  if (!insights) return [];

  return SELECTION_INSIGHT_DEFINITIONS.map(
    ({ key, icon, title, fallback }) => ({
      key,
      icon,
      title,
      content: insights[key] || fallback,
    })
  );
};

/**
 * @module ProfileStats
 * @description Displays user statistics and analytics in a card-based layout.
 * Now includes selection analytics and tournament insights.
 */

const ProfileStats = ({
  stats,
  selectionStats,
  highlights,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={styles.loadingCard}>
              <div className={styles.loadingBar} />
              <div className={styles.loadingText} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`${styles.container} ${className}`}>
        <p className={styles.noStats}>No statistics available</p>
      </div>
    );
  }

  const baseStatCards = buildStatCards(stats, STAT_CARD_SECTIONS.base);
  const selectionStatCards = buildStatCards(
    selectionStats,
    STAT_CARD_SECTIONS.selection
  );
  const selectionInsights = buildSelectionInsights(selectionStats?.insights);

  return (
    <div className={`${styles.container} ${className}`}>
      <h2 className={styles.sectionTitle}>Your Statistics & Insights</h2>

      <div className={styles.statsGrid}>
        {baseStatCards.map(({ key, ...cardProps }) => (
          <StatsCard key={key} {...cardProps} />
        ))}

        {/* Selection Analytics Section */}
        {selectionStatCards.map(({ key, ...cardProps }) => (
          <StatsCard key={key} {...cardProps} />
        ))}
      </div>

      {/* Selection Insights Section */}
      {selectionInsights.length > 0 && (
        <div className={styles.insightsSection}>
          <div className={styles.insightsGrid}>
            {selectionInsights.map(({ key, icon, title, content }) => (
              <Card
                key={key}
                className={styles.insightCard}
                variant="outlined"
                padding="medium"
                shadow="medium"
                background="transparent"
              >
                <span className={styles.insightIcon}>{icon}</span>
                <div className={styles.insightContent}>
                  <h4>{title}</h4>
                  <p>{content}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Highlights Section (compact lists) */}
      <ProfileHighlights highlights={highlights} />
    </div>
  );
};

ProfileStats.propTypes = {
  stats: PropTypes.shape({
    total_ratings: PropTypes.number,
    avg_rating: PropTypes.number,
    total_wins: PropTypes.number,
    total_losses: PropTypes.number,
    win_rate: PropTypes.number,
    hidden_count: PropTypes.number,
  }),
  selectionStats: PropTypes.shape({
    totalSelections: PropTypes.number,
    totalTournaments: PropTypes.number,
    mostSelectedName: PropTypes.string,
    currentStreak: PropTypes.number,
    insights: PropTypes.shape({
      selectionPattern: PropTypes.string,
      preferredCategories: PropTypes.string,
      improvementTip: PropTypes.string,
    }),
  }),
  highlights: PropTypes.shape({
    topRated: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    mostWins: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    recent: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
  }),
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};

export default ProfileStats;
