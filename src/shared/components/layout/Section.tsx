import type { ReactNode } from "react";
import { cn } from "@/shared/lib/basic";

interface SectionProps {
        id?: string;
        children: ReactNode;
        variant?: "minimal" | "card" | "default";
        padding?: "comfortable" | "compact" | "none";
        maxWidth?: "full" | "sm" | "md" | "lg" | "xl" | "2xl";
        className?: string;
        separator?: boolean;
        scrollMargin?: boolean;
        centered?: boolean;
}

const maxWidthClasses = {
        full: "app-section--max-full",
        sm: "app-section--max-sm",
        md: "app-section--max-md",
        lg: "app-section--max-lg",
        xl: "app-section--max-xl",
        "2xl": "app-section--max-2xl",
} as const;

const variantClasses = {
        minimal: "app-section--minimal",
        card: "app-section--card",
        default: "app-section--default",
} as const;

const paddingClasses = {
        comfortable: "app-section--comfortable",
        compact: "app-section--compact",
        none: "app-section--none",
} as const;

export function Section({
        id,
        children,
        variant = "minimal",
        padding = "comfortable",
        maxWidth = "full",
        className = "",
        separator = false,
        scrollMargin = true,
        centered = false,
}: SectionProps) {
        return (
                <section
                        id={id}
                        className={cn(
                                "app-section",
                                paddingClasses[padding],
                                maxWidthClasses[maxWidth],
                                variantClasses[variant],
                                separator && "app-section--separator",
                                !scrollMargin && "scroll-mt-0",
                                centered && "app-section--centered",
                                className,
                        )}
                >
                        {children}
                </section>
        );
}
