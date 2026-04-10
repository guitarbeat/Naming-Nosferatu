import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/basic";

interface SectionHeadingProps {
	icon?: ElementType;
	title: string;
	subtitle?: string;
	className?: string;
	children?: ReactNode;
}

export function SectionHeading({ icon: Icon, title, subtitle, className }: SectionHeadingProps) {
	return (
		<div
			className={cn(
				"mb-6 flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-1 text-center sm:mb-8",
				className,
			)}
		>
			{Icon && (
				<div
					className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary shadow-[0_12px_30px_rgba(4,11,20,0.18)]"
					aria-hidden="true"
				>
					<Icon className="h-4 w-4" />
				</div>
			)}

			<div className="isolate space-y-3">
				<h2 className="blend-difference-text text-2xl tracking-[-0.05em] text-white sm:text-3xl">
					{title}
				</h2>
				{subtitle && (
					<p className="blend-difference-text mx-auto max-w-2xl text-sm leading-relaxed text-white sm:text-base">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);
}
