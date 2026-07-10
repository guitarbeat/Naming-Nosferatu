import type { ReactNode } from "react";

export function SectionHeading({
	title,
	subtitle,
}: {
	title: string;
	subtitle: ReactNode;
}) {
	return (
		<div className="mx-auto mb-[var(--space-phi-4)] flex w-full max-w-2xl flex-col items-center text-center sm:mb-[var(--space-phi-5)]">
			<h2 className="font-display font-bold leading-[0.96] tracking-[-0.03em] text-foreground">
				{title}
			</h2>
			<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
				{subtitle}
			</p>
		</div>
	);
}
