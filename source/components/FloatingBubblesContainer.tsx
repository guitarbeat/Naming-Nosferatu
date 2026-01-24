import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { FloatingBubble } from "./FloatingBubble";
import type { BubbleState } from "./BubblePhysics";
import type { UserBubbleProfile } from "@/types/user";

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
				if (Math.abs(vx) < 0.1) vx += (Math.random() - 0.5) * 0.5;
				if (Math.abs(vy) < 0.1) vy += (Math.random() - 0.5) * 0.5;

				// Simple collision with other bubbles
				for (let j = 0; j < prevBubbles.length; j++) {
					if (i === j) continue;
					const other = prevBubbles[j];
					if (!other) continue;
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
			if (requestRef.current) cancelAnimationFrame(requestRef.current);
		};
	}, [updatePhysics]);

	return (
		<div
			className="relative overflow-hidden bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm"
			style={{ width: "100%", height: `${height}px` }}
		>
			{bubbles.map((bubble, i) => {
				const item = data[i];
				if (!item) return null;
				const id = item.id;
				const profile = profiles[id];
				if (!profile) return null;

				return (
					<FloatingBubble
						key={id}
						bubble={bubble}
						profile={profile}
						onAutofill={() => {}}
						isHighlighted={false}
					/>
				);
			})}
		</div>
	);
};
