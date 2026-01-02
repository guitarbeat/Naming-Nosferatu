/**
 * @module Loading
 * @description Unified loading component that consolidates LoadingSpinner and SuspenseView
 * Supports multiple loading display variants: spinner, suspense, and skeleton
 */

import PropTypes from "prop-types";
import type React from "react";
import { memo, Suspense, useMemo } from "react";
import styles from "./Loading.module.css";

const LOADING_ASSETS = ["/assets/images/cat.gif", "/assets/images/cat.webm"];

/**
 * Get a random loading asset
 * @returns {string} Random asset path
 */
const getRandomLoadingAsset = () => {
	return LOADING_ASSETS[Math.floor(Math.random() * LOADING_ASSETS.length)];
};

interface LoadingProps {
	variant?: "spinner" | "suspense" | "skeleton";
	text?: string;
	overlay?: boolean;
	className?: string;
	children?: React.ReactNode;
	// Skeleton-specific props
	width?: string | number;
	height?: string | number;
}

/**
 * Unified Loading Component
 * @param {LoadingProps} props - Component props
 * @returns {JSX.Element|null} The loading component or null
 */
const Loading: React.FC<LoadingProps> = ({
	variant = "spinner",
	text,
	overlay = false,
	className = "",
	children,
	width = "100%",
	height = 20,
}) => {
	const randomAsset = useMemo(() => getRandomLoadingAsset(), []);
	const isVideo = randomAsset.endsWith(".webm");

	// Suspense variant (React Suspense wrapper)
	if (variant === "suspense") {
		if (!children) return null;

		const fallback = (
			<div
				className={`${styles.container} ${overlay ? styles.overlay : ""} ${className}`}
			>
				{isVideo ? (
					<video
						src={randomAsset}
						className={styles.loadingGif}
						autoPlay
						muted
						loop
					/>
				) : (
					<img
						src={randomAsset}
						alt="Loading..."
						className={styles.loadingGif}
					/>
				)}
				{text && <p className={styles.text}>{text}</p>}
				<span className={styles.srOnly}>Loading...</span>
			</div>
		);

		return <Suspense fallback={fallback}>{children}</Suspense>;
	}

	// Skeleton variant (placeholder content)
	if (variant === "skeleton") {
		return (
			<div
				className={`${styles.skeleton} ${className}`}
				style={{
					width,
					height: typeof height === "number" ? `${height}px` : height,
				}}
				role="presentation"
				aria-hidden="true"
			>
				<div className={styles.skeletonShimmer}></div>
			</div>
		);
	}

	// Spinner variant (default - simple loading state)
	const containerClasses = [
		styles.container,
		overlay ? styles.overlay : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={containerClasses} role="status" aria-label="Loading">
			{isVideo ? (
				<video
					src={randomAsset}
					className={styles.loadingGif}
					autoPlay
					muted
					loop
				/>
			) : (
				<img src={randomAsset} alt="Loading..." className={styles.loadingGif} />
			)}
			{text && <p className={styles.text}>{text}</p>}
			<span className={styles.srOnly}>Loading...</span>
		</div>
	);
};

// PropTypes
Loading.propTypes = {
	variant: PropTypes.oneOf(["spinner", "suspense", "skeleton"]),
	text: PropTypes.string,
	overlay: PropTypes.bool,
	className: PropTypes.string,
	children: PropTypes.node,
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Loading.displayName = "Loading";

export default memo(Loading);
