import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface SectionHeadingProps {
        title: string;
        subtitle?: string;
        className?: string;
        children?: ReactNode;
}

export function SectionHeading({ title, subtitle, className }: SectionHeadingProps) {
        return (
                <div
                        className={cn(
                                "mx-auto mb-8 flex w-full max-w-2xl flex-col items-center gap-4 py-1 text-center sm:mb-10",
                                className,
                        )}
                >
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
