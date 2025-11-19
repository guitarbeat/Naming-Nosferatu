/**
 * @module TournamentSetup/components/SwipeCard
 * @description Individual swipeable card with cat name and optional image
 */
import PropTypes from "prop-types";
import { CatImage } from "../../../../shared/components";
import { DEFAULT_DESCRIPTION } from "../../constants";
import styles from "../../TournamentSetup.module.css";

function SwipeCard({
  name,
  isSelected,
  swipeDirection,
  swipeProgress,
  dragOffset,
  isDragging,
  isLongPressing,
  showCatPictures,
  imageSrc,
  isAdmin,
  gestureRef,
  onDragStart,
  onDragMove,
  onDragEnd,
}) {
  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
    opacity: isDragging ? 0.9 : 1,
  };

  const swipeOverlayStyle = {
    opacity: swipeProgress,
    transform: `scale(${0.8 + swipeProgress * 0.2})`,
  };

  return (
    <div
      className={`${styles.swipeCardWrapper} ${showCatPictures ? styles.withCatPictures : ""}`}
    >
      <div
        ref={gestureRef}
        className={`${styles.swipeCard} ${isSelected ? styles.selected : ""} ${showCatPictures ? styles.withCatPictures : ""} ${isLongPressing ? styles.longPressing : ""}`}
        style={cardStyle}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        {/* Swipe direction overlays */}
        <div
          className={`${styles.swipeOverlay} ${styles.swipeRight} ${swipeDirection === "right" ? styles.active : ""}`}
          style={
            swipeDirection === "right" ? swipeOverlayStyle : { opacity: 0 }
          }
        >
          <span className={styles.swipeText}>👍 SELECTED</span>
        </div>
        <div
          className={`${styles.swipeOverlay} ${styles.swipeLeft} ${swipeDirection === "left" ? styles.active : ""}`}
          style={swipeDirection === "left" ? swipeOverlayStyle : { opacity: 0 }}
        >
          <span className={styles.swipeText}>👎 SKIPPED</span>
        </div>

        {/* Card content */}
        <div className={styles.swipeCardContent}>
          {/* Cat picture when enabled */}
          {showCatPictures && imageSrc && (
            <CatImage
              src={imageSrc}
              containerClassName={styles.swipeCardImageContainer}
              imageClassName={styles.swipeCardImage}
              loading="eager"
              decoding="async"
            />
          )}

          <h3 className={styles.swipeCardName}>{name.name}</h3>
          <p className={styles.swipeCardDescription}>
            {name.description || DEFAULT_DESCRIPTION}
          </p>

          {/* Admin metadata */}
          {isAdmin && (
            <div className={styles.swipeCardMetadata}>
              {name.avg_rating && (
                <span className={styles.metadataItem}>
                  ⭐ {name.avg_rating}
                </span>
              )}
              {name.popularity_score && (
                <span className={styles.metadataItem}>
                  🔥 {name.popularity_score}
                </span>
              )}
              {name.categories && name.categories.length > 0 && (
                <span className={styles.metadataItem}>
                  🏷️ {name.categories.join(", ")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Selection indicator - Only show when selected */}
        {isSelected && (
          <div className={`${styles.selectionIndicator} ${styles.selected}`}>
            ✓ Selected
          </div>
        )}
      </div>
    </div>
  );
}

SwipeCard.propTypes = {
  name: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    avg_rating: PropTypes.number,
    popularity_score: PropTypes.number,
    categories: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  swipeDirection: PropTypes.oneOf(["left", "right", null]),
  swipeProgress: PropTypes.number.isRequired,
  dragOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  isDragging: PropTypes.bool.isRequired,
  isLongPressing: PropTypes.bool.isRequired,
  showCatPictures: PropTypes.bool,
  imageSrc: PropTypes.string,
  isAdmin: PropTypes.bool,
  gestureRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  onDragStart: PropTypes.func.isRequired,
  onDragMove: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
};

export default SwipeCard;
