import { type ElementType, type ReactNode } from "react";
import { themeSurfaces } from "@/shared/lib/themeClasses";
import { cn } from "@/shared/lib/utils";

type SurfaceTone = "glass" | "muted" | "inset" | "transparent";
type SurfacePadding = "none" | "compact" | "comfortable";

interface SurfaceProps {
	children: ReactNode;
	as?: ElementType;
	tone?: SurfaceTone;
	padding?: SurfacePadding;
	className?: string;
}

const toneClasses: Record<SurfaceTone, string> = {
	glass: themeSurfaces.panel,
	muted: themeSurfaces.panel,
	inset: themeSurfaces.panelInset,
	transparent: "rounded-2xl border-transparent bg-transparent shadow-none",
};

const paddingClasses: Record<SurfacePadding, string> = {
	none: "",
	compact: "p-3 sm:p-4",
	comfortable: "p-4 sm:p-6",
};

/**
 * Shared bordered/blurred surface used across panels, cards, and section wrappers.
 */
export function Surface({
	children,
	as: Component = "section",
	tone = "glass",
	padding = "comfortable",
	className = "",
}: SurfaceProps) {
	return (
		<Component className={cn(toneClasses[tone], paddingClasses[padding], className)}>
			{children}
		</Component>
	);
}
