/**
 * @module FloatingBubbles
 * @description Floating bubble visualization components with physics simulation
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { UserBubbleProfile } from "@/types/appTypes";

/* ==========================================================================
   BUBBLE PHYSICS TYPES
   ========================================================================== */

interface BubbleState {
	x: number;
	y: number;
	radius: number;
	vx: number;
	vy: number;
	isHovered: boolean;
}

/* ==========================================================================
   FLOATING BUBBLE COMPONENT
   ========================================================================== */

interface FloatingBubbleProps {
	bubble: BubbleState;
	profile: UserBubbleProfile;
	onAutofill: (username: string) => void;
	onClick?: (() => void) | undefined;
	isHighlighted?: boolean;
}

const FloatingBubble: React.FC<FloatingBubbleProps> = ({
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

/* ==========================================================================
   FLOATING BUBBLES CONTAINER
   ========================================================================== */

interface BubbleData {
	id: string;
	label: string;
	value: number;
}

interface FloatingBubblesContainerProps {
	data: BubbleData[];
	width?: number;
	height?: number;
}

export const FloatingBubblesContainer: React.FC<FloatingBubblesContainerProps> = ({
	data,
	width = 800,
	height = 400,
}) => {
	const [bubbles, setBubbles] = useState<BubbleState[]>([]);
	const [profiles, setProfiles] = useState<Record<string, UserBubbleProfile>>({});
	const requestRef = useRef<number>(null);

	// Create profiles from data
	useEffect(() => {
		const newProfiles: Record<string, UserBubbleProfile> = {};
		const initialBubbles: BubbleState[] = data.map((item) => {
			newProfiles[item.id] = {
				username: item.label,
				display_name: item.label,
				avatar_url: "", // No avatars for text labels
			};

			// Normalize radius based on value (assume value is rating)
			const minVal = Math.min(...data.map((d) => d.value));
			const maxVal = Math.max(...data.map((d) => d.value));
			const range = maxVal - minVal || 1;
			const radius = 30 + ((item.value - minVal) / range) * 40;

			return {
				x: Math.random() * (width - 2 * radius) + radius,
				y: Math.random() * (height - 2 * radius) + radius,
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				radius,
				isHovered: false,
			};
		});

		setProfiles(newProfiles);
		setBubbles(initialBubbles);
	}, [data, width, height]);

	const updatePhysics = useCallback(() => {
		setBubbles((prevBubbles) => {
			return prevBubbles.map((bubble, i) => {
				let { x, y, vx, vy, radius } = bubble;

				// Move
				x += vx;
				y += vy;

				// Boundary check
				if (x - radius < 0) {
					x = radius;
					vx *= -0.8;
				} else if (x + radius > width) {
					x = width - radius;
					vx *= -0.8;
				}

				if (y - radius < 0) {
					y = radius;
					vy *= -0.8;
				} else if (y + radius > height) {
					y = height - radius;
					vy *= -0.8;
				}

				// Friction/Damping
				vx *= 0.99;
				vy *= 0.99;

				// Impulse to keep moving
				if (Math.abs(vx) < 0.1) {
					vx += (Math.random() - 0.5) * 0.5;
				}
				if (Math.abs(vy) < 0.1) {
					vy += (Math.random() - 0.5) * 0.5;
				}

				// Simple collision with other bubbles
				for (let j = 0; j < prevBubbles.length; j++) {
					if (i === j) {
						continue;
					}
					const other = prevBubbles[j];
					if (!other) {
						continue;
					}
					const dx = other.x - x;
					const dy = other.y - y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					const minDistance = radius + other.radius;

					if (distance < minDistance) {
						// Simple push
						const angle = Math.atan2(dy, dx);
						const targetX = x + Math.cos(angle) * minDistance;
						const targetY = y + Math.sin(angle) * minDistance;
						vx -= (targetX - other.x) * 0.05;
						vy -= (targetY - other.y) * 0.05;
					}
				}

				return { ...bubble, x, y, vx, vy };
			});
		});
		requestRef.current = requestAnimationFrame(updatePhysics);
	}, [width, height]);

	useEffect(() => {
		requestRef.current = requestAnimationFrame(updatePhysics);
		return () => {
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
			}
		};
	}, [updatePhysics]);

	return (
		<div
			className="relative overflow-hidden bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm"
			style={{ width: "100%", height: `${height}px` }}
		>
			{bubbles.map((bubble, i) => {
				const item = data[i];
				if (!item) {
					return null;
				}
				const id = item.id;
				const profile = profiles[id];
				if (!profile) {
					return null;
				}

				return (
					<FloatingBubble
						key={id}
						bubble={bubble}
						profile={profile}
						onAutofill={() => {
							/* no-op */
						}}
						isHighlighted={false}
					/>
				);
			})}
		</div>
	);
};
