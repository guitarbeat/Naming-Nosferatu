import PropTypes from 'prop-types';
import styles from './ProfileDashboard.module.css';

const HIGHLIGHTS_CONFIG = {
  topRated: {
    label: 'Top Rated',
    variant: 'primary'
  },
  mostWins: {
    label: 'Most Wins',
    variant: 'success'
  }
};

function HighlightCard({ title, variant, items }) {
  return (
    <div className={`${styles.insightCard} ${styles[`card${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}>
      <h3 className={styles.cardLabel}>{title}</h3>
      <ul className={styles.compactList}>
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className={styles.compactItem}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemValue}>{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

HighlightCard.propTypes = {
  title: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['primary', 'success']).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
};

const ProfileDashboard = ({ stats, selectionStats, highlights }) => {
  const statItems = [
    { emoji: '⭐', label: 'Rated', value: stats?.names_rated || 0 },
    { emoji: '🏆', label: 'Tournaments', value: selectionStats?.tournaments_participated || stats?.tournaments_participated || 0 },
    { emoji: '🎯', label: 'Selections', value: selectionStats?.total_selections || stats?.total_selections || 0 },
    { emoji: '🔥', label: 'High Ratings', value: stats?.high_ratings || 0 }
  ];

  const hasHighlights = highlights?.topRated?.length > 0 || highlights?.mostWins?.length > 0;

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsBar}>
        {statItems.map((item) => (
          <div key={item.label} className={styles.stat}>
            <span className={styles.emoji}>{item.emoji}</span>
            <div className={styles.content}>
              <span className={styles.value}>{item.value}</span>
              <span className={styles.label}>{item.label}</span>
            </div>
          </div>
        ))}
      </div>
      {hasHighlights && (
        <div className={styles.highlightsSection}>
          {highlights.topRated?.length > 0 && (
            <HighlightCard
              title={HIGHLIGHTS_CONFIG.topRated.label}
              variant={HIGHLIGHTS_CONFIG.topRated.variant}
              items={highlights.topRated}
            />
          )}
          {highlights.mostWins?.length > 0 && (
            <HighlightCard
              title={HIGHLIGHTS_CONFIG.mostWins.label}
              variant={HIGHLIGHTS_CONFIG.mostWins.variant}
              items={highlights.mostWins}
            />
          )}
        </div>
      )}
    </div>
  );
};

ProfileDashboard.propTypes = {
  stats: PropTypes.object,
  selectionStats: PropTypes.object,
  highlights: PropTypes.shape({
    topRated: PropTypes.array,
    mostWins: PropTypes.array,
  }),
};

export default ProfileDashboard;