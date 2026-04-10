import type React from "react";
import { memo, Suspense, useMemo } from "react";
import { cn } from "@/shared/lib/basic";
import { Cat, Heart, PawPrint } from "@/shared/lib/icons";

const LOADING_ASSETS = ["/assets/images/cat.gif"];

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
	message?: string;
	overlay?: boolean;
	className?: string;
	children?: React.ReactNode;
	width?: string | number;
	height?: string | number;
	size?: "small" | "medium" | "large";
}

function getRandomLoadingAsset() {
	return LOADING_ASSETS[Math.floor(Math.random() * LOADING_ASSETS.length)];
}

function SpinnerCircle({
	size = "medium",
	className,
}: {
	size?: "small" | "medium" | "large";
	className?: string;
}) {
	const dimensions =
		size === "large"
			? "h-12 w-12 border-4"
			: size === "small"
				? "h-6 w-6 border-2"
				: "h-8 w-8 border-4";

	return (
		<div
			className={cn(
				"animate-spin rounded-full border-white/10 border-t-primary border-r-primary/60",
				dimensions,
				className,
			)}
			aria-hidden={true}
		/>
	);
}

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.12),rgba(255,255,255,0.04))] bg-[length:200%_100%]",
				className,
			)}
			style={style}
			aria-hidden={true}
		/>
	);
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
				<div className="text-pink-500 motion-safe:animate-[float_1.1s_ease-in-out_infinite]">
					<PawPrint size={iconSize} />
				</div>
			);
		case "tail":
		case "bounce":
			return (
				<div className="text-purple-500 motion-safe:animate-[bounce_900ms_ease-in-out_infinite]">
					<Cat size={iconSize} />
				</div>
			);
		case "spin":
			return (
				<div className="text-cyan-500 motion-safe:animate-spin [animation-duration:2s]">
					<Cat size={iconSize} />
				</div>
			);
		case "heartbeat":
			return (
				<div className="relative flex items-center justify-center">
					<div className="absolute text-red-500 motion-safe:animate-[bounce_800ms_ease-in-out_infinite]">
						<Heart size={iconSize} fill="currentColor" />
					</div>
					{showFace && (
						<Cat size={iconSize * 0.6} className="relative z-10 text-white drop-shadow-md" />
					)}
				</div>
			);
		case "orbit":
			return (
				<div className="relative flex h-12 w-12 items-center justify-center">
					<div className="absolute h-full w-full motion-safe:animate-spin [animation-duration:3s]">
						<div className="absolute left-1/2 top-0 -translate-x-1/2 text-yellow-500">
							<Cat size={16} />
						</div>
					</div>
					{showFace && <div className="text-xl">🐱</div>}
				</div>
			);
		default:
			return <SpinnerCircle size={size} />;
	}
});

CatSpinnerContent.displayName = "CatSpinnerContent";

export const Loading: React.FC<LoadingProps> = memo(
	({
		variant = "spinner",
		catVariant = "paw",
		showCatFace = true,
		text,
		message,
		overlay = false,
		className = "",
		children,
		width = "100%",
		height = 20,
		size = "medium",
		cardSkeletonVariant = "name-card",
	}) => {
		const resolvedText = text ?? message;
		const randomAsset = useMemo(() => getRandomLoadingAsset(), []);
		const isVideo = randomAsset.endsWith(".webm");
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
							className="h-24 w-24 rounded-full bg-white/5 p-2 object-contain"
							autoPlay={true}
							muted={true}
							loop={true}
						/>
					) : (
						<img src={randomAsset} alt="Loading..." className="h-24 w-24 object-contain" />
					)}
					{resolvedText && (
						<p className="animate-pulse text-sm font-medium text-white/70">{resolvedText}</p>
					)}
					<span className="sr-only">Loading...</span>
				</div>
			);

			return <Suspense fallback={fallback}>{children}</Suspense>;
		}

		if (variant === "skeleton") {
			return (
				<SkeletonBlock
					className={cn("rounded-lg", className)}
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
						"flex flex-col gap-3 overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm",
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
						<SkeletonBlock className="h-10 w-10 rounded-full" />
						<div className="flex flex-1 flex-col gap-2">
							<SkeletonBlock className="h-4 w-3/4" />
							<SkeletonBlock className="h-3 w-1/2" />
						</div>
					</div>
					<SkeletonBlock className="min-h-[100px] w-full flex-1" />
					<div className="flex justify-end pt-2">
						<SkeletonBlock className="h-8 w-20" />
					</div>
					{resolvedText && (
						<div className="pt-2 text-center text-xs text-white/50">{resolvedText}</div>
					)}
				</div>
			);
		}

		if (variant === "bongo") {
			return (
				<div className={containerClasses} role="status" aria-label="Loading">
					<div className="relative flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
						<CatSpinnerContent catVariant="bounce" showFace={true} size={size} />
					</div>
					{resolvedText && (
						<p className="animate-pulse text-sm font-medium text-white/70">{resolvedText}</p>
					)}
				</div>
			);
		}

		if (variant === "cat") {
			return (
				<div className={containerClasses} role="status" aria-label="Loading">
					<div className="relative flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
						<CatSpinnerContent catVariant={catVariant} showFace={showCatFace} size={size} />
					</div>
					{resolvedText && (
						<p className="animate-pulse text-sm font-medium text-white/70">{resolvedText}</p>
					)}
					<span className="sr-only">Loading...</span>
				</div>
			);
		}

		return (
			<div className={containerClasses} role="status" aria-label="Loading">
				<SpinnerCircle size={size} />
				{resolvedText ? (
					<p className="mt-2 text-sm font-medium text-white/70">{resolvedText}</p>
				) : (
					<span className="sr-only">Loading...</span>
				)}
			</div>
		);
	},
);

Loading.displayName = "Loading";
