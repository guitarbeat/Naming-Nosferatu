/**
 * @module StatusIndicators
 * @description Status and loading indicator components: Loading, OfflineIndicator, PerformanceBadge, TrendIndicator
 * Styles consolidated in source/styles/components.css
 */

import { Skeleton, Spinner } from "@heroui/react";
import { cn } from "@utils";
import { motion } from "framer-motion";
import { Cat, Heart, PawPrint } from "lucide-react";
import type React from "react";
import { memo, Suspense, useEffect, useMemo, useState } from "react";
import { useBrowserState } from "@/hooks/useBrowserState";
import { BongoCat } from "./CatVisuals";

/* ==========================================================================
   LOADING COMPONENT
   ========================================================================== */

const LOADING_ASSETS = ["/assets/images/cat.gif", "/assets/images/cat.webm"];

const getRandomLoadingAsset = () => {
	return LOADING_ASSETS[Math.floor(Math.random() * LOADING_ASSETS.length)];
};

type CatVariant = "paw" | "tail" | "bounce" | "spin" | "heartbeat" | "orbit";
type CatColor = "neon" | "pastel" | "warm";
type CardSkeletonVariant = "name-card" | "elevated-card" | "mosaic-card";

interface LoadingProps {
	variant?: "spinner" | "cat" | "bongo" | "suspense" | "skeleton" | "card-skeleton";
	catVariant?: CatVariant;
	catColor?: CatColor;
	showCatFace?: boolean;
	cardSkeletonVariant?: CardSkeletonVariant;
	text?: string;
	overlay?: boolean;
	className?: string;
	children?: React.ReactNode;
	width?: string | number;
	height?: string | number;
	size?: "small" | "medium" | "large";
}

const CatSpinnerContent: React.FC<{
	catVariant: CatVariant;
	showFace: boolean;
	size?: "small" | "medium" | "large";
}> = memo(({ catVariant, showFace, size = "medium" }) => {
	const iconSize = size === "large" ? 48 : size === "medium" ? 32 : 24;

	switch (catVariant) {
		case "paw":
			return (
				<motion.div
					animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
					transition={{ duration: 1.5, repeat: Infinity }}
					className="text-pink-500"
				>
					<PawPrint size={iconSize} />
				</motion.div>
			);

		case "tail":
		case "bounce":
			return (
				<motion.div
					animate={{ y: [0, -10, 0] }}
					transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
					className="text-purple-500"
				>
					<Cat size={iconSize} />
				</motion.div>
			);

		case "spin":
			return (
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					className="text-cyan-500"
				>
					<Cat size={iconSize} />
				</motion.div>
			);

		case "heartbeat":
			return (
				<div className="relative flex items-center justify-center">
					<motion.div
						animate={{ scale: [1, 1.3, 1] }}
						transition={{ duration: 0.8, repeat: Infinity }}
						className="text-red-500 absolute"
					>
						<Heart size={iconSize} fill="currentColor" />
					</motion.div>
					{showFace && (
						<Cat size={iconSize * 0.6} className="relative z-10 text-white drop-shadow-md" />
					)}
				</div>
			);

		case "orbit":
			return (
				<div className="relative flex items-center justify-center w-12 h-12">
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
						className="absolute w-full h-full"
					>
						<div className="absolute top-0 left-1/2 -translate-x-1/2 text-yellow-500">
							<Cat size={16} />
						</div>
					</motion.div>
					{showFace && <div className="text-xl">🐱</div>}
				</div>
			);

		default:
			return (
				<Spinner
					color="secondary"
					size={size === "small" ? "sm" : size === "large" ? "lg" : "md"}
				/>
			);
	}
});

CatSpinnerContent.displayName = "CatSpinnerContent";

export const Loading: React.FC<LoadingProps> = memo(
	({
		variant = "spinner",
		catVariant = "paw",
		showCatFace = true,
		text,
		overlay = false,
		className = "",
		children,
		width = "100%",
		height = 20,
		size = "medium",
		cardSkeletonVariant = "name-card",
	}) => {
		const randomAsset = useMemo(() => getRandomLoadingAsset(), []);
		const isVideo = (randomAsset || "").endsWith(".webm");

		const containerClasses = cn(
			"flex flex-col items-center justify-center gap-3 p-4",
			overlay && "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
			className,
		);

		if (variant === "suspense") {
			if (!children) {
				return null;
			}

			const fallback = (
				<div className={containerClasses}>
					{isVideo ? (
						<video
							src={randomAsset}
							className="w-24 h-24 object-contain rounded-full bg-white/5 p-2"
							autoPlay={true}
							muted={true}
							loop={true}
						/>
					) : (
						<img src={randomAsset} alt="Loading..." className="w-24 h-24 object-contain" />
					)}
					{text && <p className="text-sm font-medium text-white/70 animate-pulse">{text}</p>}
					<span className="sr-only">Loading...</span>
				</div>
			);

			return <Suspense fallback={fallback}>{children}</Suspense>;
		}

		if (variant === "skeleton") {
			return (
				<Skeleton
					className={cn("rounded-lg bg-white/5", className)}
					style={{
						width,
						height: typeof height === "number" ? `${height}px` : height,
					}}
				/>
			);
		}

		if (variant === "card-skeleton") {
			return (
				<div
					className={cn(
						"rounded-xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-sm flex flex-col p-4 gap-3",
						cardSkeletonVariant === "elevated-card" && "shadow-lg",
						className,
					)}
					style={{
						width,
						height: typeof height === "number" ? `${height}px` : height,
						minHeight:
							typeof height === "number"
								? `${height}px`
								: cardSkeletonVariant === "name-card"
									? "200px"
									: "auto",
					}}
				>
					<div className="flex items-center gap-3">
						<Skeleton className="rounded-full w-10 h-10" />
						<div className="flex flex-col gap-2 flex-1">
							<Skeleton className="h-4 w-3/4 rounded-lg" />
							<Skeleton className="h-3 w-1/2 rounded-lg" />
						</div>
					</div>
					<Skeleton className="flex-1 rounded-lg w-full min-h-[100px]" />
					<div className="flex justify-end pt-2">
						<Skeleton className="h-8 w-20 rounded-lg" />
					</div>
					{text && <div className="text-center text-xs text-white/50 pt-2">{text}</div>}
				</div>
			);
		}

		if (variant === "bongo") {
			return (
				<div className={containerClasses}>
					<BongoCat size={size} text={text} />
				</div>
			);
		}

		if (variant === "cat") {
			return (
				<div className={containerClasses} role="status" aria-label="Loading">
					<div className="relative flex items-center justify-center p-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
						<CatSpinnerContent catVariant={catVariant} showFace={showCatFace} size={size} />
					</div>
					{text && <p className="text-sm font-medium text-white/70 animate-pulse">{text}</p>}
					<span className="sr-only">Loading...</span>
				</div>
			);
		}

		return (
			<div className={containerClasses} role="status" aria-label="Loading">
				<Spinner
					color="secondary"
					size={size === "small" ? "sm" : size === "large" ? "lg" : "md"}
					label={text}
					classNames={{ label: "text-white/70 font-medium mt-2" }}
				/>
				{!text && <span className="sr-only">Loading...</span>}
			</div>
		);
	},
);

Loading.displayName = "Loading";

/* ==========================================================================
   OFFLINE INDICATOR COMPONENT
   ========================================================================== */

interface OfflineIndicatorProps {
	showWhenOnline?: boolean;
	position?: "top" | "bottom";
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
	showWhenOnline = false,
	position = "top",
}) => {
	const { isOnline, isSlowConnection } = useBrowserState();
	const [showIndicator, setShowIndicator] = useState(false);
	const [justCameOnline, setJustCameOnline] = useState(false);

	useEffect(() => {
		if (!isOnline) {
			setShowIndicator(true);
			setJustCameOnline(false);
		} else if (showWhenOnline || justCameOnline) {
			setShowIndicator(true);
			if (!justCameOnline) {
				setJustCameOnline(true);
				setTimeout(() => {
					setShowIndicator(false);
					setJustCameOnline(false);
				}, 3000);
			}
		} else {
			setShowIndicator(false);
		}
	}, [isOnline, showWhenOnline, justCameOnline]);

	if (!showIndicator) {
		return null;
	}

	const getStatusMessage = () => {
		if (!isOnline) {
			return "You are offline";
		}
		if (justCameOnline) {
			return "Back online";
		}
		if (isSlowConnection) {
			return "Slow connection detected";
		}
		return "Connected";
	};

	const getStatusClass = () => {
		if (!isOnline) {
			return "offline";
		}
		if (justCameOnline) {
			return "online";
		}
		if (isSlowConnection) {
			return "slow";
		}
		return "online";
	};

	return (
		<div className={`indicator ${position} ${getStatusClass()}`}>
			<div className="indicator-content">
				<span className="indicator-dot" />
				<span className="indicator-message">{getStatusMessage()}</span>
			</div>
		</div>
	);
};

/* ==========================================================================
   PERFORMANCE BADGE COMPONENT
   ========================================================================== */

const INSIGHT_CATEGORIES: Record<string, { label: string; icon: string; description: string }> = {
	top_rated: {
		label: "Top Rated",
		icon: "⭐",
		description: "Among the highest rated names",
	},
	trending_up: {
		label: "Trending",
		icon: "📈",
		description: "Rising in popularity",
	},
	trending_down: {
		label: "Declining",
		icon: "📉",
		description: "Decreasing in popularity",
	},
	new: { label: "New", icon: "✨", description: "Recently added" },
	undefeated: {
		label: "Undefeated",
		icon: "🏆",
		description: "Has never lost a matchup",
	},
	popular: { label: "Popular", icon: "❤️", description: "Frequently selected" },
	underdog: {
		label: "Underdog",
		icon: "🐕",
		description: "Low rating but gaining traction",
	},
};

const getInsightCategory = (type: string) => INSIGHT_CATEGORIES[type] || null;

interface PerformanceBadgeProps {
	type: string;
	label?: string;
	variant?: "sm" | "md";
	className?: string;
}

function PerformanceBadge({ type, label, variant = "md", className = "" }: PerformanceBadgeProps) {
	const category = getInsightCategory(type);

	if (!category && !label) {
		return null;
	}

	const badgeLabel = label || category?.label || type;
	const badgeIcon = category?.icon || "•";
	const badgeDescription = category?.description || "";
	const badgeClass =
		`performance-badge performance-badge-${type} performance-badge-${variant} ${className}`.trim();

	return (
		<span className={badgeClass} aria-label={`${badgeLabel}: ${badgeDescription}`} role="status">
			<span className="badge-icon" aria-hidden="true">
				{badgeIcon}
			</span>
			<span className="badge-label">{badgeLabel}</span>
		</span>
	);
}

PerformanceBadge.displayName = "PerformanceBadge";

interface PerformanceBadgesProps {
	types?: string[];
	className?: string;
}

export function PerformanceBadges({ types = [], className = "" }: PerformanceBadgesProps) {
	if (!types || types.length === 0) {
		return null;
	}

	return (
		<div className={`performance-badges ${className}`.trim()}>
			{types.map((type) => (
				<PerformanceBadge key={type} type={type} variant="sm" />
			))}
		</div>
	);
}

PerformanceBadges.displayName = "PerformanceBadges";

/* ==========================================================================
   TREND INDICATOR COMPONENT
   ========================================================================== */

interface TrendIndicatorProps {
	direction?: "up" | "down" | "stable";
	percentChange?: number;
	compact?: boolean;
	className?: string;
	animated?: boolean;
}

export function TrendIndicator({
	direction = "stable",
	percentChange = 0,
	compact = false,
	className = "",
	animated = true,
}: TrendIndicatorProps) {
	const trendClass =
		`trend-indicator trend-${direction} ${animated ? "trend-animated" : ""} ${className}`.trim();

	const renderIcon = () => {
		switch (direction) {
			case "up":
				return (
					<span className="trend-icon" aria-hidden="true">
						📈
					</span>
				);
			case "down":
				return (
					<span className="trend-icon" aria-hidden="true">
						📉
					</span>
				);
			default:
				return (
					<span className="trend-icon" aria-hidden="true">
						➡️
					</span>
				);
		}
	};

	const ariaLabel = `${direction === "up" ? "Trending up" : direction === "down" ? "Trending down" : "Stable"} ${percentChange ? `by ${percentChange}%` : ""}`;

	if (compact) {
		return (
			<span className={trendClass} aria-label={ariaLabel}>
				{renderIcon()}
			</span>
		);
	}

	return (
		<span className={trendClass} aria-label={ariaLabel}>
			{renderIcon()}
			{percentChange !== 0 && (
				<span className="trend-value">
					{direction === "up" ? "+" : direction === "down" ? "−" : ""}
					{percentChange}%
				</span>
			)}
		</span>
	);
}

TrendIndicator.displayName = "TrendIndicator";
