/**
 * @module ImageGrid
 * @description Masonry-style image grid component reusing useMasonryLayout hook.
 * Provides responsive 2+ column layout on mobile, matching NameGrid patterns.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ImageIcon, ZoomIn } from "lucide-react";
import { useMasonryLayout } from "../../hooks/useMasonryLayout";
import styles from "./ImageGrid.module.css";

interface ImageGridProps {
  images: string[];
  onImageOpen: (image: string) => void;
  isLoading?: boolean;
  className?: string;
}

interface ImageGridItemProps {
  src: string;
  index: number;
  onClick: () => void;
  style: React.CSSProperties;
  setRef: (el: HTMLDivElement | null) => void;
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.25,
      ease: "easeOut" as const,
    },
  }),
};

const ImageGridItem = memo(function ImageGridItem({
  src,
  index,
  onClick,
  style,
  setRef,
}: ImageGridItemProps) {
  return (
    <motion.div
      ref={setRef}
      className={styles.gridItem}
      style={style}
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <button
        type="button"
        className={styles.imageCard}
        onClick={onClick}
        aria-label={`View image ${index + 1}`}
      >
        <div className={styles.imageWrapper}>
          <img
            src={src}
            alt={`Gallery image ${index + 1}`}
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
          <div className={styles.imageOverlay}>
            <ZoomIn className={styles.overlayIcon} />
          </div>
        </div>
      </button>
    </motion.div>
  );
});

function LoadingSkeleton({ count = 8, columnWidth, gap }: { count?: number; columnWidth: number; gap: number }) {
  // Generate skeleton positions in a simple grid pattern
  const skeletons = useMemo(() => {
    const cols = Math.max(2, Math.floor(300 / (columnWidth + gap)));
    return Array.from({ length: count }, (_, i) => ({
      left: (i % cols) * (columnWidth + gap),
      top: Math.floor(i / cols) * (columnWidth + gap),
      width: columnWidth,
      height: columnWidth,
    }));
  }, [count, columnWidth, gap]);

  return (
    <>
      {skeletons.map((pos, i) => (
        <div
          key={`skeleton-${i}`}
          className={styles.skeleton}
          style={{
            left: pos.left,
            top: pos.top,
            width: pos.width,
            height: pos.height,
          }}
        />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <ImageIcon className={styles.emptyIcon} />
      <p className={styles.emptyText}>No images yet</p>
    </div>
  );
}

export const ImageGrid = memo(function ImageGrid({
  images,
  onImageOpen,
  isLoading = false,
  className = "",
}: ImageGridProps) {
  // Compact masonry config for gallery: smaller columns, tighter gaps
  const {
    containerRef,
    setItemRef,
    positions,
    totalHeight,
    columnWidth,
  } = useMasonryLayout<HTMLDivElement>(images.length, {
    minColumnWidth: 140, // Smaller for mobile 2-col grid
    gap: 8,              // Tighter gap
  });

  if (!isLoading && images.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`${styles.imageGrid} ${className}`}>
      <div
        ref={containerRef}
        className={styles.gridContainer}
        style={{ height: totalHeight || "auto" }}
      >
        {isLoading && images.length === 0 ? (
          <LoadingSkeleton columnWidth={columnWidth || 140} gap={8} />
        ) : (
          images.map((image, index) => {
            const position = positions[index];
            if (!position) return null;

            return (
              <ImageGridItem
                key={image}
                src={image}
                index={index}
                onClick={() => onImageOpen(image)}
                style={{
                  left: position.left,
                  top: position.top,
                  width: columnWidth,
                }}
                setRef={setItemRef(index)}
              />
            );
          })
        )}
      </div>
    </div>
  );
});

export default ImageGrid;
