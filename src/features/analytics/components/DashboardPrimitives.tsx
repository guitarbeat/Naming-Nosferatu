import type { ElementType, ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
	return (
		<section
			className={`rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(4,10,20,0.14)] backdrop-blur-xl sm:p-6 ${className}`}
		>
			{children}
		</section>
	);
}

export function StatTile({
	label,
	value,
	icon: Icon,
	accent = false,
}: {
	label: string;
	value: string | number;
	icon?: ElementType;
	accent?: boolean;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
						{label}
					</p>
					<p
						className={`mt-2 text-2xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}
					>
						{value}
					</p>
				</div>
				{Icon && (
					<div
						className={`rounded-2xl border p-2.5 ${
							accent
								? "border-primary/20 bg-primary/12 text-primary"
								: "border-white/10 bg-white/[0.04] text-white/65"
						}`}
					>
						<Icon size={16} />
					</div>
				)}
			</div>
		</div>
	);
}

export function SectionHeader({
	icon: Icon,
	title,
	subtitle,
	action,
}: {
	icon: ElementType;
	title: string;
	subtitle?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div className="space-y-2">
				<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
					<Icon size={14} className="text-primary" />
					<span>{title}</span>
				</div>
				{subtitle && (
					<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">{subtitle}</p>
				)}
			</div>
			{action}
		</div>
	);
}
