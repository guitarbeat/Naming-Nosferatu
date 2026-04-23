import { type ElementType, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type SurfaceTone = "glass" | "muted" | "transparent";
type SurfacePadding = "none" | "compact" | "comfortable";
type SurfaceRadius = "md" | "lg" | "xl";

interface SurfaceProps {
        children: ReactNode;
        as?: ElementType;
        tone?: SurfaceTone;
        padding?: SurfacePadding;
        radius?: SurfaceRadius;
        bordered?: boolean;
        elevated?: boolean;
        className?: string;
}

const toneClasses: Record<SurfaceTone, string> = {
        glass: "bg-white/[0.04] backdrop-blur-xl",
        muted: "bg-black/15",
        transparent: "bg-transparent",
};

const paddingClasses: Record<SurfacePadding, string> = {
        none: "",
        compact: "p-3 sm:p-4",
        comfortable: "p-4 sm:p-6",
};

const radiusClasses: Record<SurfaceRadius, string> = {
        md: "rounded-2xl",
        lg: "rounded-[1.75rem]",
        xl: "rounded-[1.85rem]",
};

/**
 * Shared bordered/blurred surface used across panels, cards, and section wrappers.
 * Replaces ad-hoc `rounded-[…] border border-white/10 bg-white/[0.04]` patterns.
 */
export function Surface({
        children,
        as: Component = "section",
        tone = "glass",
        padding = "comfortable",
        radius = "lg",
        bordered = true,
        elevated = false,
        className = "",
}: SurfaceProps) {
        return (
                <Component
                        className={cn(
                                radiusClasses[radius],
                                toneClasses[tone],
                                paddingClasses[padding],
                                bordered && "border border-white/10",
                                elevated && "shadow-[0_16px_40px_rgba(4,10,20,0.14)]",
                                className,
                        )}
                >
                        {children}
                </Component>
        );
}

export default Surface;
