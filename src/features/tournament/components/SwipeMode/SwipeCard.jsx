import PropTypes from "prop-types";
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
  const translateX = dragOffset?.x ?? 0;
  const translateY = dragOffset?.y ?? 0;

  return (
    <div
      ref={gestureRef}
      className={`${styles.swipeCard} ${isSelected ? styles.selected : ""}`}
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        opacity: swipeDirection ? 0.9 : 1,
        transition: isDragging ? "none" : "transform 0.2s ease",
      }}
      onMouseDown={onDragStart}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onTouchStart={onDragStart}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
      aria-pressed={isSelected}
      role="button"
    >
      {showCatPictures && imageSrc ? (
        <img
          src={imageSrc}
          alt={name?.name || "Cat"}
          className={styles.swipeCardImage}
        />
      ) : null}
      <div className={styles.swipeCardContent}>
        <div className={styles.swipeCardTitle}>{name?.name || "Unknown"}</div>
        {name?.description ? (
          <div className={styles.swipeCardDescription}>{name.description}</div>
        ) : null}
        {isAdmin && isLongPressing ? (
          <div className={styles.swipeCardBadge}>Admin</div>
        ) : null}
        {swipeDirection ? (
          <div className={styles.swipeCardBadge}>
            {swipeDirection} {(swipeProgress * 100).toFixed(0)}%
          </div>
        ) : null}
      </div>
    </div>
  );
}

SwipeCard.propTypes = {
  name: PropTypes.object,
  isSelected: PropTypes.bool,
  swipeDirection: PropTypes.string,
  swipeProgress: PropTypes.number,
  dragOffset: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  isDragging: PropTypes.bool,
  isLongPressing: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageSrc: PropTypes.string,
  isAdmin: PropTypes.bool,
  gestureRef: PropTypes.any,
  onDragStart: PropTypes.func,
  onDragMove: PropTypes.func,
  onDragEnd: PropTypes.func,
};

export default SwipeCard;
