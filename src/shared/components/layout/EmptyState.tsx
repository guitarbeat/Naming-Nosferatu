import type { ReactNode } from "react";
import { themeSurfaces } from "@/shared/lib/themeClasses";
import { cn } from "@/shared/lib/utils";

interface EmptyStateProps {
	title: string;
	description?: ReactNode;
	className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				themeSurfaces.panelInset,
				"px-4 py-8 text-center text-sm text-muted-foreground/75",
				className,
			)}
		>
			<p>{title}</p>
			{description && <p className="mt-1">{description}</p>}
		</div>
	);
}
