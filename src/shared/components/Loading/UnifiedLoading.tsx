import React from 'react';
import styles from './Loading.module.css';

export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'overlay';
export type LoadingSize = 'small' | 'medium' | 'large';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'medium',
  text,
  overlay = false,
  className = '',
}) => {
  const baseClass = `${styles.loading} ${styles[variant]} ${styles[size]} ${className}`;
  const wrapperClass = overlay ? `${styles.overlay} ${baseClass}` : baseClass;

  const renderSpinner = () => (
    <div className={styles.spinner}>
      <div className={styles.spinnerCircle} />
    </div>
  );

  const renderDots = () => (
    <div className={styles.dots}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
  );

  const renderPulse = () => (
    <div className={styles.pulse}>
      <div className={styles.pulseCircle} />
    </div>
  );

  const renderSkeleton = () => (
    <div className={styles.skeleton}>
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'skeleton': return renderSkeleton();
      default: return renderSpinner();
    }
  };

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      {renderContent()}
      {text && <span className={styles.text}>{text}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};
