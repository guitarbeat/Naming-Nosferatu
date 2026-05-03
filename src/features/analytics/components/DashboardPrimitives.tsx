import React, {
        cloneElement,
        type ElementType,
        isValidElement,
        type ReactNode,
        useEffect,
        useRef,
        useState,
} from "react";
import { Surface } from "@/shared/components/layout/Surface";

export const CHART_TOOLTIP_STYLE = {
        background: "rgba(14, 18, 28, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        borderRadius: 10,
        fontSize: 12,
        color: "#d4dce8",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.32)",
} as const;

export const CHART_CURSOR = { fill: "rgba(63, 184, 176, 0.06)" } as const;

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
                        ? cloneElement(children as React.ReactElement<{ width?: number; height?: number }>, { width: size.width, height: size.height })
                        : null;

        return (
                <div ref={frameRef} className={`chart-frame ${variant === "tall" ? "chart-frame--tall" : ""}`}>
                        {chart}
                </div>
        );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
        return (
                <Surface radius="lg" elevated className={className}>
                        {children}
                </Surface>
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
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-5 text-center">
                        {Icon && (
                                <div
                                        className={`rounded-lg border p-2 ${
                                                accent
                                                        ? "border-primary/15 bg-primary/8 text-primary"
                                                        : "border-white/[0.07] bg-white/[0.03] text-white/40"
                                        }`}
                                >
                                        <Icon size={14} />
                                </div>
                        )}
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                                {label}
                        </p>
                        <p
                                className={`text-2xl font-semibold leading-none ${accent ? "text-primary" : "text-white/80"}`}
                        >
                                {value}
                        </p>
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
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                tone === "accent"
                                        ? "border-primary/15 bg-primary/8 text-primary/80"
                                        : "border-white/[0.07] bg-white/[0.025] text-white/35"
                        }`}
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
                                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{title}</span>
                                </div>
                                {subtitle && (
                                        <p className="max-w-2xl text-sm leading-relaxed text-white/35">{subtitle}</p>
                                )}
                        </div>
                        {action}
                </div>
        );
}
