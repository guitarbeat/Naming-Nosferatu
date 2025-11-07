import PropTypes from 'prop-types';
import styles from './ProfileHighlights.module.css';

/**
 * Configuration for highlight cards
 */
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

/**
 * HighlightCard - Reusable card component for displaying ranked items
 */
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

/**
 * ProfileHighlights Component
 * Displays top rated and most wins in a compact grid layout
 */
const ProfileHighlights = ({ highlights = { topRated: [], mostWins: [] } }) => {
  const hasData = highlights?.topRated?.length > 0 || highlights?.mostWins?.length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <div className={styles.insightsSection}>
      <div className={styles.insightsGrid}>
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
