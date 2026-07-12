import { Loader2 } from "lucide-react";
import type React from "react";
import { memo } from "react";
import { cn } from "@/shared/lib/utils";

type ButtonVariant =
	| "primary"
	| "danger"
	| "ghost"
	| "outline"
	| "flat"
	| "glass";
type ButtonSize = "small" | "medium" | "large" | "icon";

const baseButtonClass =
	"inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-wide rounded-[var(--radius-button)] transition-[transform,box-shadow,background-color,opacity,filter] duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none";

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-primary text-primary-foreground shadow-sm hover:brightness-110 motion-safe:hover:shadow-md motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96] active:shadow-sm active:brightness-95",
	danger:
		"bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 motion-safe:hover:shadow-md motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 active:shadow-sm active:brightness-95 motion-safe:active:scale-[0.96]",
	ghost:
		"text-foreground/80 hover:bg-accent/50 hover:text-accent-foreground active:bg-accent/70",
	outline:
		"border border-border bg-transparent text-foreground shadow-sm hover:bg-accent/30 hover:border-border/80 hover:text-accent-foreground motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 active:bg-accent/50 motion-safe:active:scale-[0.96]",
	flat: "text-foreground/80 hover:bg-accent/40 active:bg-accent/60",
	glass:
		"border border-white/15 bg-white/10 text-foreground shadow-sm backdrop-blur-md hover:bg-white/15 hover:border-white/25 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 active:bg-white/20 motion-safe:active:scale-[0.96]",
};

const sizeClasses: Record<ButtonSize, string> = {
	small:
		"h-8 px-3 py-1.5 text-xs rounded-md sm:h-8 md:h-8 min-h-[44px] sm:min-h-auto",
	medium: "h-10 px-4 py-2.5 text-sm sm:h-9 min-h-[44px] sm:min-h-auto",
	large: "h-12 px-6 py-3 text-base sm:h-11 min-h-[44px]",
	icon: "h-10 w-10 p-0 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px]",
};

interface ButtonProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
	children: React.ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
	className?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	iconOnly?: boolean;
}

const Button = ({
	children,
	variant = "primary",
	size = "medium",
	disabled = false,
	loading = false,
	type = "button",
	className = "",
	onClick,
	iconOnly = false,
	...rest
}: ButtonProps) => {
	const finalSize = iconOnly ? "icon" : size;

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		onClick?.(event);
	};

	return (
		<button
			type={type}
			disabled={disabled || loading}
			className={cn(
				baseButtonClass,
				variantClasses[variant],
				sizeClasses[finalSize],
				className,
			)}
			onClick={handleClick}
			{...rest}
		>
			{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			{!iconOnly && children}
			{iconOnly && !loading && children}
		</button>
	);
};

Button.displayName = "Button";

export default memo(Button);
