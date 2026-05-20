import { cn } from "@/shared/lib/utils";

interface SectionHeadingProps {
	title: string;
	subtitle?: string;
	className?: string;
}

export function SectionHeading({ title, subtitle, className }: SectionHeadingProps) {
	return (
		<div
			className={cn(
				"mx-auto flex w-full max-w-2xl flex-col items-center text-center",
				"mb-[var(--space-phi-4)] sm:mb-[var(--space-phi-5)]",
				className,
			)}
		>
			<h2 className="font-display leading-[0.96] tracking-[-0.03em] text-white/90">{title}</h2>
			{subtitle && (
				<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/40 sm:text-base">
					{subtitle}
				</p>
			)}
		</div>
	);
}
