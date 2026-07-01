import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface SectionProps {
	id?: string;
	children: ReactNode;
	maxWidth?: "md" | "xl" | "2xl";
	className?: string;
	separator?: boolean;
	fullpage?: boolean;
}

const maxWidthClasses = {
	md: "app-section--max-md",
	xl: "app-section--max-xl",
	"2xl": "app-section--max-2xl",
} as const;

export function Section({
	id,
	children,
	maxWidth = "2xl",
	className = "",
	separator = false,
	fullpage = false,
}: SectionProps) {
	return (
		<section
			id={id}
			className={cn(
				"app-section",
				maxWidthClasses[maxWidth],
				separator && "app-section--separator",
				fullpage && "app-section--fullpage",
				className,
			)}
		>
			{children}
		</section>
	);
}
