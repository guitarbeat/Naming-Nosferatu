/**
 * @module Section
 * @description Standardized section layout component for consistent full-page sections.
 * Provides unified padding, centering, and glass variants.
 */

import type React from "react";
import { useId } from "react";
import { cn } from "@/utils/basic";
import { GLASS_PRESETS } from "./GlassPresets";
import { LiquidGlass } from "./LayoutEffects";

type SectionVariant = "default" | "glass" | "minimal" | "accent";
type SectionPadding = "none" | "compact" | "comfortable" | "spacious";

interface SectionProps {
	/** Section ID for navigation/scroll targeting */
	id?: string;
	/** Visual variant */
	variant?: SectionVariant;
	/** Padding size */
	padding?: SectionPadding;
	/** Center content horizontally */
	centered?: boolean;
	/** Maximum width constraint */
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
	/** Children content */
	children: React.ReactNode;
	/** Additional className */
	className?: string;
	/** Additional className for inner content wrapper */
	contentClassName?: string;
	/** Whether to add scroll margin for sticky headers */
	scrollMargin?: boolean;
	/** Whether to add top border separator */
	separator?: boolean;
	/** Disable min-height for compact sections */
	compact?: boolean;
}

const paddingClasses: Record<SectionPadding, string> = {
	none: "p-0",
	compact: "p-4 py-12",
	comfortable: "p-4 py-20",
	spacious: "p-6 py-32",
};

const maxWidthClasses: Record<NonNullable<SectionProps["maxWidth"]>, string> = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	full: "max-w-full",
};

export function Section({
	id,
	variant = "default",
	padding = "comfortable",
	centered = true,
	maxWidth = "2xl",
	children,
	className,
	contentClassName,
	scrollMargin = true,
	separator = false,
	compact = false,
}: SectionProps) {
	const glassId = useId();

	const sectionClasses = cn(
		!compact && "min-h-[60vh]",
		"flex flex-col items-center justify-center",
		paddingClasses[padding],
		scrollMargin && "scroll-mt-20",
		separator && "border-t border-white/5",
		className,
	);

	const contentClasses = cn(
		"w-full mx-auto",
		maxWidthClasses[maxWidth],
		centered && "flex flex-col items-center justify-center",
		contentClassName,
	);

	// Glass variant uses LiquidGlass
	if (variant === "glass") {
		return (
			<section id={id} className={sectionClasses}>
				<div className={contentClasses}>
					<LiquidGlass
						id={`section-glass-${glassId.replace(/:/g, "-")}`}
						className="w-full flex flex-col items-center justify-center backdrop-blur-md rounded-3xl"
						style={{ width: "100%", height: "auto", minHeight: "200px" }}
						{...GLASS_PRESETS.card}
					>
						{children}
					</LiquidGlass>
				</div>
			</section>
		);
	}

	// Accent variant with gradient border
	if (variant === "accent") {
		return (
			<section id={id} className={sectionClasses}>
				<div
					className={cn(
						contentClasses,
						"bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8",
					)}
				>
					{children}
				</div>
			</section>
		);
	}

	// Minimal variant with no background
	if (variant === "minimal") {
		return (
			<section id={id} className={sectionClasses}>
				<div className={contentClasses}>{children}</div>
			</section>
		);
	}

	// Default variant
	return (
		<section id={id} className={sectionClasses}>
			<div className={contentClasses}>{children}</div>
		</section>
	);
}
