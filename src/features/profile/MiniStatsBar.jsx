import styles from './MiniStatsBar.module.css';

const MiniStatsBar = ({ stats, selectionStats }) => {
  const statItems = [
    { emoji: '⭐', label: 'Rated', value: stats?.names_rated || 0 },
    { emoji: '🏆', label: 'Tournaments', value: selectionStats?.tournaments_participated || stats?.tournaments_participated || 0 },
    { emoji: '🎯', label: 'Selections', value: selectionStats?.total_selections || stats?.total_selections || 0 },
    { emoji: '🔥', label: 'High Ratings', value: stats?.high_ratings || 0 }
  ];

  return (
    <div className={styles.bar}>
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
  );
};

export default MiniStatsBar;
