/**
 * @module Loading
 * @description Loading component with spinner, suspense, and skeleton variants.
 */

import type React from "react";
import { memo, Suspense, useMemo } from "react";
import styles from "./Loading.module.css";

const LOADING_ASSETS = ["/assets/images/cat.gif", "/assets/images/cat.webm"];

const getRandomLoadingAsset = () => {
	return LOADING_ASSETS[Math.floor(Math.random() * LOADING_ASSETS.length)];
};

export interface LoadingProps {
	variant?: "spinner" | "suspense" | "skeleton";
	text?: string;
	overlay?: boolean;
	className?: string;
	children?: React.ReactNode;
	width?: string | number;
	height?: string | number;
}

export const Loading: React.FC<LoadingProps> = memo(
	({
		variant = "spinner",
		text,
		overlay = false,
		className = "",
		children,
		width = "100%",
		height = 20,
	}) => {
		const randomAsset = useMemo(() => getRandomLoadingAsset(), []);
		const isVideo = (randomAsset || "").endsWith(".webm");

		// Suspense variant
		if (variant === "suspense") {
			if (!children) {
				return null;
			}

			const fallback = (
				<div
					className={`${styles.loadingContainer} ${overlay ? styles.loadingOverlay : ""} ${className}`}
				>
					{isVideo ? (
						<video
							src={randomAsset}
							className={styles.loadingGif}
							autoPlay={true}
							muted={true}
							loop={true}
						/>
					) : (
						<img src={randomAsset} alt="Loading..." className={styles.loadingGif} />
					)}
					{text && <p className={styles.loadingText}>{text}</p>}
					<span className={styles.srOnly}>Loading...</span>
				</div>
			);

			return <Suspense fallback={fallback}>{children}</Suspense>;
		}

		// Skeleton variant
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

		// Spinner variant
		const containerClasses = [
			styles.loadingContainer,
			overlay ? styles.loadingOverlay : "",
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
						autoPlay={true}
						muted={true}
						loop={true}
					/>
				) : (
					<img src={randomAsset} alt="Loading..." className={styles.loadingGif} />
				)}
				{text && <p className={styles.loadingText}>{text}</p>}
				<span className={styles.srOnly}>Loading...</span>
			</div>
		);
	},
);

Loading.displayName = "Loading";

export default Loading;
