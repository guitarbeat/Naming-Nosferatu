/**
 * @module Loading
 * @description Unified loading component with spinner, cat, suspense, and skeleton variants.
 */

import type React from "react";
import { memo, Suspense, useMemo } from "react";
import styles from "./Loading.module.css";

const LOADING_ASSETS = ["/assets/images/cat.gif", "/assets/images/cat.webm"];

const getRandomLoadingAsset = () => {
	return LOADING_ASSETS[Math.floor(Math.random() * LOADING_ASSETS.length)];
};

export type CatVariant = "paw" | "tail" | "bounce" | "spin" | "heartbeat" | "orbit";
export type CatColor = "neon" | "pastel" | "warm";

export interface LoadingProps {
	variant?: "spinner" | "cat" | "suspense" | "skeleton";
	/** Cat animation variant (only used when variant="cat") */
	catVariant?: CatVariant;
	/** Cat color theme (only used when variant="cat") */
	catColor?: CatColor;
	/** Show cat face (only used when variant="cat") */
	showCatFace?: boolean;
	text?: string;
	overlay?: boolean;
	className?: string;
	children?: React.ReactNode;
	width?: string | number;
	height?: string | number;
	size?: "small" | "medium" | "large";
}

// Cat spinner sub-component
const CatSpinnerContent: React.FC<{
	catVariant: CatVariant;
	showFace: boolean;
}> = memo(({ catVariant, showFace }) => {
	switch (catVariant) {
		case "paw":
			return (
				<>
					<div className={styles.pawContainer}>
						<div className={styles.paw}>
							<div className={styles.pawPad} />
							<div className={styles.pawPad} />
							<div className={styles.pawPad} />
							<div className={styles.pawPad} />
						</div>
					</div>
					{showFace && <div className={styles.catFace} />}
				</>
			);

		case "tail":
			return (
				<>
					<div className={styles.tailContainer}>
						<div className={styles.tail}>
							<div className={styles.tailSegment} />
							<div className={styles.tailSegment} />
							<div className={styles.tailSegment} />
							<div className={styles.tailSegment} />
							<div className={styles.tailSegment} />
						</div>
					</div>
					{showFace && <div className={styles.catFace} />}
				</>
			);

		case "bounce":
			return (
				<>
					<div className={styles.bounceContainer}>
						<div className={styles.bouncingCat}>
							<div className={styles.catBody} />
							<div className={styles.catHead} />
						</div>
					</div>
					{showFace && <div className={styles.catFace} />}
				</>
			);

		case "spin":
			return (
				<div className={styles.spinContainer}>
					<div className={styles.spinningCat}>
						{showFace && (
							<>
								<div className={styles.ear} />
								<div className={styles.ear} />
								<div className={styles.eye} />
								<div className={styles.eye} />
								<div className={styles.nose} />
							</>
						)}
					</div>
				</div>
			);

		case "heartbeat":
			return (
				<>
					<div className={styles.heartbeatContainer}>
						<div className={styles.heartCat}>
							<div className={styles.heartShape} />
							<div className={styles.heartEyes} />
						</div>
					</div>
					{showFace && <div className={styles.catFace} />}
				</>
			);

		case "orbit":
			return (
				<div className={styles.orbitContainer}>
					<div className={styles.orbitRing}>
						<div className={styles.orbitCat} />
					</div>
					{showFace && <div className={styles.catFace} />}
				</div>
			);

		default:
			return (
				<>
					<div className={styles.pawContainer}>
						<div className={styles.paw}>
							<div className={styles.pawPad} />
							<div className={styles.pawPad} />
							<div className={styles.pawPad} />
							<div className={styles.pawPad} />
						</div>
					</div>
					{showFace && <div className={styles.catFace} />}
				</>
			);
	}
});

CatSpinnerContent.displayName = "CatSpinnerContent";

export const Loading: React.FC<LoadingProps> = memo(
	({
		variant = "spinner",
		catVariant = "paw",
		catColor = "neon",
		showCatFace = true,
		text,
		overlay = false,
		className = "",
		children,
		width = "100%",
		height = 20,
		size = "medium",
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
					<div className={styles.skeletonShimmer} />
				</div>
			);
		}

		// Cat variant
		if (variant === "cat") {
			const containerClasses = [
				styles.catSpinner,
				styles[size],
				styles[catVariant],
				styles[catColor],
				showCatFace && styles.withFace,
				className,
			]
				.filter(Boolean)
				.join(" ");

			return (
				<div className={containerClasses} role="status" aria-label="Loading">
					<div className={styles.spinnerContainer}>
						<CatSpinnerContent catVariant={catVariant} showFace={showCatFace} />
					</div>
					{text && <p className={styles.spinnerText}>{text}</p>}
					<span className={styles.srOnly}>Loading...</span>
				</div>
			);
		}

		// Spinner variant (default)
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
