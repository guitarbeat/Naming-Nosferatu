import type { ReactNode } from "react";
import { cn } from "@/shared/lib/basic";

interface SectionProps {
	id?: string;
	children: ReactNode;
	variant?: "minimal" | "card" | "default";
	padding?: "comfortable" | "compact" | "none";
	maxWidth?: "full" | "sm" | "md" | "lg" | "xl" | "2xl";
	className?: string;
	separator?: boolean;
	scrollMargin?: boolean;
	centered?: boolean;
}

const paddingClasses = {
	comfortable: "px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12",
	compact: "px-4 py-5 sm:px-6 sm:py-7 md:px-8",
	none: "",
} as const;

const maxWidthClasses = {
	full: "w-full",
	sm: "mx-auto w-full max-w-xl",
	md: "mx-auto w-full max-w-2xl",
	lg: "mx-auto w-full max-w-4xl",
	xl: "mx-auto w-full max-w-6xl",
	"2xl": "mx-auto w-full max-w-7xl",
} as const;

const variantClasses = {
	minimal: "",
	card: "rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6",
	default: "bg-background/50",
} as const;

export function Section({
	id,
	children,
	variant = "minimal",
	padding = "comfortable",
	maxWidth = "full",
	className = "",
	separator = false,
	scrollMargin = true,
	centered = false,
}: SectionProps) {
	return (
		<section
			id={id}
			className={cn(
				paddingClasses[padding],
				maxWidthClasses[maxWidth],
				variantClasses[variant],
				separator && "border-t border-white/10 pt-10 sm:pt-12",
				scrollMargin && "scroll-mt-24 sm:scroll-mt-16",
				centered && "flex w-full flex-col items-center",
				className,
			)}
		>
			{children}
		</section>
	);
}
