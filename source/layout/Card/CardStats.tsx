/**
 * @module CardStats
 * @description Stats sub-component for Card
 */

import React from "react";
import { cn } from "@/utils/basic";
import { Card, type CardProps, type CardVariant } from "./Card";

export interface CardStatsProps extends CardProps {
	title?: string;
	label?: string;
	value: string | number | React.ReactNode;
	emoji?: React.ReactNode;
	labelClassName?: string;
	valueClassName?: string;
	emojiClassName?: string;
}

/**
 * Stats sub-component for displaying statistics
 */
export const CardStats: React.FC<CardStatsProps> = ({
	title,
	label,
	value,
	emoji,
	className = "",
	labelClassName = "",
	valueClassName = "",
	emojiClassName = "",
	variant = "default", // Default variant to invoke color styles
	...props
}) => {
	const labelText = title || label || "Statistic";
	const valueText = typeof value === "string" || typeof value === "number" ? value : "";
	const ariaLabel = valueText ? `${labelText}: ${valueText}` : labelText;

	// Determine top accent color based on variant
	const accentGradient: Record<CardVariant, string> = {
		default: "from-white/20 to-white/5",
		primary: "from-purple-500 to-purple-700",
		success: "from-green-500 to-green-700",
		warning: "from-yellow-500 to-yellow-700",
		info: "from-cyan-500 to-cyan-700",
		danger: "from-red-500 to-red-700",
		secondary: "from-gray-500 to-gray-700",
		elevated: "from-white/20 to-white/5",
		outlined: "from-transparent to-transparent",
		filled: "from-transparent to-transparent",
	};

	const valueColor: Record<CardVariant, string> = {
		default: "text-white",
		primary: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200",
		success: "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-200",
		warning: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200",
		info: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200",
		danger: "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-200",
		secondary: "text-gray-400",
		elevated: "text-white",
		outlined: "text-white",
		filled: "text-white",
	};

	return (
		<Card
			variant={variant}
			className={cn(
				"flex flex-col items-center justify-center text-center min-h-[120px] relative pt-6",
				className,
			)}
			role="status"
			aria-label={ariaLabel}
			{...props}
		>
			{/* Top accent bar */}
			<div
				className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient[variant] || accentGradient.default}`}
			/>

			{(title || label) && (
				<span
					className={cn(
						"text-xs font-semibold uppercase tracking-wider text-white/50 mb-2",
						labelClassName,
					)}
				>
					{title || label}
				</span>
			)}
			<span
				className={cn(
					"text-4xl font-bold p-1 overflow-hidden",
					valueColor[variant] || valueColor.default,
					valueClassName,
				)}
			>
				{value}
			</span>
			{emoji && <span className={cn("text-2xl mt-2 drop-shadow-sm", emojiClassName)}>{emoji}</span>}
		</Card>
	);
};
