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
  stackIndex = 0,
}) {
  const depth = Math.max(0, stackIndex);
  const isTopCard = depth === 0;
  const translateX = dragOffset?.x ?? 0;
  const translateY = dragOffset?.y ?? 0;
  const rotation = Math.max(-15, Math.min(15, translateX / 5));
  const baseOpacity = 1 - Math.min(swipeProgress * 0.4, 0.6);
  const stackedScale = 1 - depth * 0.04;
  const stackedTranslateY = depth * 16;
  const stackedOpacity = isTopCard ? baseOpacity : 0.55;
  const shouldAnimateStack = !isDragging && !isLongPressing;

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
        aria-hidden={!isTopCard}
        style={{
          transform: `translate(${translateX}px, ${translateY + stackedTranslateY}px) rotate(${rotation}deg) scale(${stackedScale})`,
          opacity: stackedOpacity,
          zIndex: 8 - depth,
          pointerEvents: isTopCard ? "auto" : "none",
          filter: isTopCard ? "none" : "saturate(0.92) brightness(0.95)",
          transition: shouldAnimateStack
            ? "transform 240ms ease, opacity 240ms ease, filter 240ms ease"
            : "none",
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
  stackIndex: PropTypes.number,
};

export default SwipeCard;
