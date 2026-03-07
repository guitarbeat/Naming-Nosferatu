import { memo } from "react";
import { cn } from "@/shared/lib/basic";
import type { CardStatsProps, CardVariant } from "./Card.types";
import { Card } from "./CardBase";

const CardStatsBase = memo(function CardStats({
	title,
	label,
	value,
	emoji,
	className = "",
	labelClassName = "",
	valueClassName = "",
	emojiClassName = "",
	variant = "default",
	...props
}: CardStatsProps) {
	const labelText = title || label || "stat";
	const valueText =
		typeof value === "string" || typeof value === "number" ? String(value) : "value";
	const ariaLabel = `${labelText}: ${valueText}`;

	const accentGradient: Record<CardVariant, string> = {
		default: "from-foreground/20 to-foreground/5",
		primary: "from-primary to-primary/70",
		success: "from-chart-2 to-chart-2/70",
		warning: "from-chart-4 to-chart-4/70",
		info: "from-chart-5 to-chart-5/70",
		danger: "from-destructive to-destructive/70",
		secondary: "from-secondary to-secondary/70",
		elevated: "from-foreground/20 to-foreground/5",
		outlined: "from-transparent to-transparent",
		filled: "from-transparent to-transparent",
	};
	const valueColor: Record<CardVariant, string> = {
		default: "text-foreground",
		primary: "text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60",
		success: "text-transparent bg-clip-text bg-gradient-to-r from-chart-2 to-chart-2/60",
		warning: "text-transparent bg-clip-text bg-gradient-to-r from-chart-4 to-chart-4/60",
		info: "text-transparent bg-clip-text bg-gradient-to-r from-chart-5 to-chart-5/60",
		danger: "text-transparent bg-clip-text bg-gradient-to-r from-destructive to-destructive/60",
		secondary: "text-secondary-foreground",
		elevated: "text-foreground",
		outlined: "text-foreground",
		filled: "text-foreground",
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
			<div
				className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient[variant] || accentGradient.default}`}
			/>

			{(title || label) && (
				<span
					className={cn(
						"text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2",
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
});

CardStatsBase.displayName = "CardStats";

export const CardStats = CardStatsBase;
