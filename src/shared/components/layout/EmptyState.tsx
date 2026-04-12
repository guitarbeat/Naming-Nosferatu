import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/basic";

interface EmptyStateProps {
	icon?: ElementType;
	title: string;
	description?: ReactNode;
	variant?: "centered" | "box" | "inline";
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	variant = "centered",
	className,
}: EmptyStateProps) {
	if (variant === "box") {
		return (
			<div
				className={cn(
					"rounded-2xl border border-white/10 bg-black/15 px-4 py-8 text-center text-sm text-muted-foreground/75",
					className,
				)}
			>
				<p>{title}</p>
				{description && <p className="mt-1">{description}</p>}
			</div>
		);
	}

	if (variant === "inline") {
		return (
			<div className={cn("px-4 py-8 text-center text-sm text-muted-foreground/75", className)}>
				{title}
			</div>
		);
	}

	return (
		<div className={cn("flex items-center justify-center p-8", className)}>
			<div className="text-center text-muted-foreground">
				{Icon && <Icon size={48} className="mx-auto mb-4" />}
				<h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
				{description && <div className="text-sm space-y-1">{description}</div>}
			</div>
		</div>
	);
}
