import React, {
	cloneElement,
	type ElementType,
	isValidElement,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { Card } from "@/shared/components/layout/Card/Card";
import { themeSurfaces, themeText } from "@/shared/lib/themeClasses";
import { cn } from "@/shared/lib/utils";

export const CHART_TOOLTIP_STYLE = {
	background: "var(--chart-tooltip-bg)",
	border: "1px solid var(--chart-tooltip-border)",
	borderRadius: 10,
	fontSize: 12,
	color: "var(--chart-tooltip-fg)",
	boxShadow: "var(--chart-tooltip-shadow)",
} as const;

export const CHART_CURSOR = { fill: "var(--chart-cursor-fill)" } as const;

export function ChartFrame({
	children,
	variant = "default",
}: {
	children: ReactNode;
	variant?: "default" | "tall";
}) {
	const frameRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const element = frameRef.current;
		if (!element) {
			return;
		}

		const updateSize = () => {
			const { width, height } = element.getBoundingClientRect();
			setSize({
				width: Math.max(0, Math.floor(width)),
				height: Math.max(0, Math.floor(height)),
			});
		};

		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	const chart =
		size.width > 0 && size.height > 0 && isValidElement(children)
			? cloneElement(
					children as React.ReactElement<{ width?: number; height?: number }>,
					{
						width: size.width,
						height: size.height,
					},
				)
			: null;

	return (
		<div
			ref={frameRef}
			className={`chart-frame ${variant === "tall" ? "chart-frame--tall" : ""}`}
		>
			{chart}
		</div>
	);
}

export function Panel({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card variant="default" shadow="large" className={className}>
			{children}
		</Card>
	);
}

/** Bordered list container shared by leaderboard, hidden names, and similar panels. */
export function ListPanel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn(themeSurfaces.panelInset, className)}>{children}</div>
	);
}

export function ListPanelRow({
	children,
	divided = true,
	className,
}: {
	children: ReactNode;
	divided?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 px-4 py-3",
				divided && themeSurfaces.rowDivider,
				className,
			)}
		>
			{children}
		</div>
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
		<div className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4 transition-all hover:border-primary/30 hover:shadow-md">
			<div className="absolute -top-6 -right-6 size-12 rounded-full bg-primary/5 blur-xl transition-transform group-hover:scale-110" />
			<div className="relative space-y-2">
				<div className="flex items-center justify-between">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{label}
					</p>
					{Icon && (
						<div
							className={cn(
								"rounded-lg p-2 transition-colors",
								accent
									? "bg-primary/20 text-primary"
									: "bg-muted text-muted-foreground",
							)}
						>
							<Icon size={14} />
						</div>
					)}
				</div>
				<p
					className={cn(
						"text-2xl font-bold tracking-tight",
						accent && "text-primary",
					)}
				>
					{value}
				</p>
			</div>
		</div>
	);
}

export function ContextBadge({
	label,
	tone = "default",
}: {
	label: string;
	tone?: "default" | "accent";
}) {
	return (
		<span
			className={
				tone === "accent" ? themeSurfaces.badgeAccent : themeSurfaces.badge
			}
		>
			{label}
		</span>
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
		<div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div className="space-y-1.5">
				<div className="flex items-center gap-2">
					<Icon size={13} className="text-primary/70 shrink-0" />
					<span className={themeText.sectionLabel}>{title}</span>
				</div>
				{subtitle && (
					<p className={cn("max-w-2xl", themeText.subtitle)}>{subtitle}</p>
				)}
			</div>
			{action}
		</div>
	);
}
