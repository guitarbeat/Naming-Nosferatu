/**
 * Stub: replace with your real Section layout component.
 *
 * Generic content section with configurable width, padding, and styling.
 */

import type { ReactNode } from "react";

interface SectionProps {
	id?: string;
	children: ReactNode;
	variant?: "minimal" | "card" | "default";
	padding?: "comfortable" | "compact" | "none";
	maxWidth?: "full" | "lg" | "xl" | "2xl";
	className?: string;
}

const paddingClasses = {
	comfortable: "px-4 py-8",
	compact: "px-3 py-4",
	none: "",
} as const;

const maxWidthClasses = {
	full: "w-full",
	lg: "max-w-4xl mx-auto w-full",
	xl: "max-w-6xl mx-auto w-full",
	"2xl": "max-w-7xl mx-auto w-full",
} as const;

export function Section({
	id,
	children,
	padding = "comfortable",
	maxWidth = "full",
	className = "",
}: SectionProps) {
	return (
		<section
			id={id}
			className={`${paddingClasses[padding]} ${maxWidthClasses[maxWidth]} ${className}`}
		>
			{children}
		</section>
	);
}
