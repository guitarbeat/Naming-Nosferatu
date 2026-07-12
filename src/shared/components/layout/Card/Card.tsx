import React, { memo } from "react";
import { cn } from "@/shared/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
	variant?: "default" | "filled";
	padding?: "none" | "medium";
	shadow?: "medium" | "large";
}

const CardBase = memo(
	React.forwardRef<HTMLDivElement, CardProps>(
		(
			{
				children,
				className = "",
				variant = "default",
				padding = "medium",
				shadow = "medium",
				...props
			},
			ref,
		) => {
			const finalClasses = cn(
				"relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 backdrop-blur-md",
				variant === "filled"
					? "bg-foreground/10 border-none"
					: "bg-foreground/5 border border-border/10 bg-background/40",
				padding === "none" ? "p-0" : "p-5",
				shadow === "large" ? "shadow-lg" : "shadow-md",
				className,
				"before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:pointer-events-none before:z-0",
				"before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]",
			);

			return (
				<div
					ref={ref}
					className={finalClasses}
					{...props}
				>
					<div className="relative z-10 h-full">{children}</div>
				</div>
			);
		},
	),
);

CardBase.displayName = "Card";

export const Card = CardBase;
