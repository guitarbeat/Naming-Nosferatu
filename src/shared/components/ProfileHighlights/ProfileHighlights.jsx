import PropTypes from 'prop-types';
import Card from '../Card/Card';
import styles from './ProfileHighlights.module.css';

/**
 * ProfileHighlights Component
 * Displays top rated, most wins, and recent updates in a compact grid layout
 */
const ProfileHighlights = ({ highlights = { topRated: [], mostWins: [], recent: [] } }) => {
  // Early return if no highlights data
  if (
    !highlights ||
    (highlights.topRated.length === 0 &&
      highlights.mostWins.length === 0 &&
      highlights.recent.length === 0)
  ) {
    return null;
  }

  return (
    <div className={styles.insightsSection}>
      <div className={styles.insightsGrid}>
        {highlights.topRated.length > 0 && (
          <div className={`${styles.insightCard} ${styles.cardPrimary}`}>
            <h3 className={styles.cardLabel}>Top Rated</h3>
            <ul className={styles.compactList}>
              {highlights.topRated.slice(0, 5).map((item) => (
                <li key={item.id} className={styles.compactItem}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemValueBadge}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {highlights.mostWins.length > 0 && (
          <div className={`${styles.insightCard} ${styles.cardSuccess}`}>
            <h3 className={styles.cardLabel}>Most Wins</h3>
            <ul className={styles.compactList}>
              {highlights.mostWins.slice(0, 5).map((item) => (
                <li key={item.id} className={styles.compactItem}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemValueBadge}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

ProfileHighlights.propTypes = {
  highlights: PropTypes.shape({
    topRated: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      })
    ),
    mostWins: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      })
    ),
    recent: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      })
    ),
  }),
};

export default ProfileHighlights;
