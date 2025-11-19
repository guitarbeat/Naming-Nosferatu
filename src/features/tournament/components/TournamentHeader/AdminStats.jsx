/**
 * @module TournamentSetup/components/AdminStats
 * @description Admin-only statistics display
 */
import PropTypes from "prop-types";
import styles from "../../TournamentSetup.module.css";

function AdminStats({ availableNames }) {
  const avgRating =
    availableNames.length > 0
      ? Math.round(
          availableNames.reduce(
            (sum, name) => sum + (name.avg_rating || 1500),
            0,
          ) / availableNames.length,
        )
      : 1500;

  const popularCount = availableNames.filter(
    (name) => (name.popularity_score || 0) > 5,
  ).length;

  return (
    <div className={styles.nameStats}>
      <span className={styles.statItem}>
        📊 {availableNames.length} total names
      </span>
      <span className={styles.statItem}>⭐ {avgRating} avg rating</span>
      <span className={styles.statItem}>🔥 {popularCount} popular names</span>
    </div>
  );
}

AdminStats.propTypes = {
  availableNames: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default AdminStats;
