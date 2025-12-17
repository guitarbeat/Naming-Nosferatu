import PropTypes from "prop-types";
import clsx from "clsx";
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
  const rotation = Math.max(-15, Math.min(15, translateX / 5));
  const opacity = 1 - Math.min(swipeProgress * 0.4, 0.6);

  const cardClassName = clsx(styles.swipeCard, {
    [styles.withCatPictures]: showCatPictures,
    [styles.selected]: isSelected,
    [styles.longPressing]: isLongPressing,
  });

  return (
    <div className={styles.swipeCardWrapper}>
      <div
        className={cardClassName}
        data-direction={swipeDirection || "neutral"}
        data-selected={isSelected}
        data-dragging={isDragging}
        data-long-pressing={isLongPressing}
        style={{
          transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
          opacity,
        }}
        ref={gestureRef}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        role="article"
        aria-label={`Name card for ${name?.name || "Unknown"}`}
      >
        {showCatPictures && imageSrc ? (
          <div className={styles.swipeCardImageContainer}>
            <img
              src={imageSrc}
              alt={`${name?.name || "Cat"} illustration`}
              className={styles.swipeCardImage}
            />
          </div>
        ) : null}

        <div className={styles.swipeCardContent}>
          <div className={styles.swipeCardName}>{name?.name || "Unknown"}</div>
          {name?.description ? (
            <p className={styles.swipeCardDescription}>{name.description}</p>
          ) : null}
          {isAdmin ? (
            <span className={styles.swipeCardAdminBadge}>Admin</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

SwipeCard.propTypes = {
  name: PropTypes.object,
  isSelected: PropTypes.bool,
  swipeDirection: PropTypes.oneOf(["left", "right", null]),
  swipeProgress: PropTypes.number,
  dragOffset: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
  isDragging: PropTypes.bool,
  isLongPressing: PropTypes.bool,
  showCatPictures: PropTypes.bool,
  imageSrc: PropTypes.string,
  isAdmin: PropTypes.bool,
  gestureRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  onDragStart: PropTypes.func,
  onDragMove: PropTypes.func,
  onDragEnd: PropTypes.func,
};

export default SwipeCard;
