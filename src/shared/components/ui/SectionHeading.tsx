import { memo } from "react";

export const SectionHeading = memo(function SectionHeading({
	id,
	title,
	subtitle,
}: {
	id?: string;
	title: string;
	subtitle: string;
}) {
	return (
		<div className="mx-auto mb-[var(--space-phi-4)] flex w-full max-w-2xl flex-col items-center text-center sm:mb-[var(--space-phi-5)]">
			<h2
				id={id}
				className="font-display font-bold leading-[0.96] tracking-[-0.03em] text-foreground"
			>
				{title}
			</h2>
			<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
				{subtitle}
			</p>
		</div>
	);
});
