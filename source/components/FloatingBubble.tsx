import React, { useCallback, useState } from "react";
import type { UserBubbleProfile } from "@/types/user";
import type { BubbleState } from "./BubblePhysics";

interface FloatingBubbleProps {
	bubble: BubbleState;
	profile: UserBubbleProfile;
	onAutofill: (username: string) => void;
	onClick?: (() => void) | undefined;
	isHighlighted?: boolean;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
	bubble,
	profile,
	onAutofill,
	onClick,
	isHighlighted = false,
}) => {
	const [isPoppingOut, setIsPoppingOut] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);

	const handleImageLoad = useCallback(() => setImageLoaded(true), []);
	const handleImageError = useCallback(() => setImageError(true), []);

	const handleClick = () => {
		// Trigger pop animation before action
		setIsPoppingOut(true);
		setTimeout(() => {
			if (onClick) {
				onClick();
			} else {
				onAutofill(profile.username);
			}
		}, 150);
	};

	const scale = isPoppingOut ? 1.3 : bubble.isHovered ? 1.15 : isHighlighted ? 1.1 : 1;
	const opacity = isPoppingOut ? 0 : bubble.isHovered ? 1 : 0.92;
	const displayName = profile.display_name || profile.username;

	// Extended touch target padding (invisible hit area)
	const touchPadding = 16;

	// Calculate motion blur direction based on velocity
	const velocityMagnitude = Math.sqrt(bubble.vx ** 2 + bubble.vy ** 2);
	const motionBlurX = bubble.vx * 2;
	const motionBlurY = bubble.vy * 2;
	const showMotionBlur = velocityMagnitude > 0.5;

	return (
		<button
			type="button"
			className="absolute pointer-events-auto select-none bg-transparent border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-coral rounded-full"
			style={{
				// Position accounts for touch padding
				transform: `translate3d(${bubble.x - bubble.radius - touchPadding}px, ${bubble.y - bubble.radius - touchPadding}px, 0) scale(${scale})`,
				// Size includes invisible touch padding
				width: `${bubble.radius * 2 + touchPadding * 2}px`,
				height: `${bubble.radius * 2 + touchPadding * 2}px`,
				padding: `${touchPadding}px`,
				opacity,
				willChange: "transform, opacity",
				transition: isPoppingOut
					? "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease-out"
					: "transform 150ms ease-out, opacity 200ms ease",
			}}
			onClick={handleClick}
			aria-label={`Select ${displayName}`}
		>
			<div className="relative w-full h-full">
				{/* Highlight ring for matched username */}
				{isHighlighted && !isPoppingOut && (
					<div
						className="absolute inset-0 rounded-full ring-4 ring-green-400/60 animate-pulse"
						style={{ margin: "-4px" }}
					/>
				)}

				{/* Motion blur shadow */}
				{showMotionBlur && (
					<div
						className="absolute inset-0 rounded-full bg-gradient-to-br from-coral/20 via-rose-pink/15 to-lavender/20 blur-md"
						style={{
							transform: `translate(${-motionBlurX}px, ${-motionBlurY}px)`,
							opacity: Math.min(velocityMagnitude * 0.3, 0.5),
						}}
					/>
				)}

				{/* Glow effect */}
				<div
					className={`absolute inset-0 rounded-full blur-sm ${
						isHighlighted
							? "bg-gradient-to-br from-green-400/50 via-green-300/40 to-green-400/50"
							: "bg-gradient-to-br from-coral/40 via-rose-pink/30 to-lavender/40"
					}`}
					style={{
						transform: bubble.isHovered || isHighlighted ? "scale(1.25)" : "scale(1)",
						transition: "transform 0.3s ease",
					}}
				/>

				{/* Main bubble */}
				<div
					className={`relative w-full h-full rounded-full overflow-hidden bg-white/90 backdrop-blur-sm border-2 shadow-lg ${
						isHighlighted ? "border-green-400/70" : "border-white/50"
					}`}
				>
					{profile.avatar_url && !imageError ? (
						<>
							{/* Placeholder shown while loading */}
							<div
								className={`absolute inset-0 flex items-center justify-center font-bold text-lg transition-opacity duration-300 ${
									isHighlighted
										? "bg-gradient-to-br from-green-100 via-green-50 to-green-100 text-green-600"
										: "bg-gradient-to-br from-coral/20 via-rose-pink/20 to-lavender/20 text-coral"
								}`}
								style={{ opacity: imageLoaded ? 0 : 1 }}
							>
								{profile.display_name?.[0]?.toUpperCase() || profile.username[0]?.toUpperCase()}
							</div>
							<img
								src={profile.avatar_url}
								alt=""
								className="w-full h-full object-cover transition-opacity duration-300"
								style={{ opacity: imageLoaded ? 1 : 0 }}
								loading="lazy"
								decoding="async"
								onLoad={handleImageLoad}
								onError={handleImageError}
							/>
						</>
					) : (
						<div
							className={`w-full h-full flex items-center justify-center font-bold text-lg ${
								isHighlighted
									? "bg-gradient-to-br from-green-100 via-green-50 to-green-100 text-green-600"
									: "bg-gradient-to-br from-coral/20 via-rose-pink/20 to-lavender/20 text-coral"
							}`}
						>
							{profile.display_name?.[0]?.toUpperCase() || profile.username[0]?.toUpperCase()}
						</div>
					)}
				</div>

				{/* Pop out ring effect */}
				{isPoppingOut && (
					<div className="absolute inset-0 rounded-full border-2 border-coral/50 animate-ping" />
				)}
			</div>
		</button>
	);
};
