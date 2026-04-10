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
				"mb-8 flex w-full max-w-2xl flex-col items-center gap-4 py-1 text-center sm:mb-10",
				className,
			)}
		>
			{Icon && (
				<div
					className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-primary shadow-[0_12px_30px_rgba(4,11,20,0.18)]"
					aria-hidden="true"
				>
					<Icon className="h-4 w-4" />
				</div>
			)}

			<div className="isolate space-y-3">
				<h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-[0.96] tracking-[-0.045em] text-white">
					{title}
				</h2>
				{subtitle && (
					<p className="mx-auto max-w-xl text-sm leading-relaxed text-white/68 sm:text-base">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);
}
