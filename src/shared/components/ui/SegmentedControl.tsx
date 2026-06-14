import { motion } from "framer-motion";
import { useMemo } from "react";

interface SegmentedControlOption<T extends string = string> {
	value: T;
	label: string;
	icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
	options: readonly SegmentedControlOption<T>[];
	value: T;
	onChange: (value: T) => void;
	fullWidth?: boolean;
	size?: "small" | "medium";
	disabled?: boolean;
	ariaLabel?: string;
}

export function SegmentedControl<T extends string = string>({
	options,
	value,
	onChange,
	fullWidth = false,
	size = "medium",
	disabled = false,
	ariaLabel,
}: SegmentedControlProps<T>) {
	const sizeStyles = useMemo(() => {
		if (size === "small") {
			return {
				container: "h-8 gap-0.5",
				button: "px-3 py-1.5 text-xs font-medium",
				indicator: "rounded-md",
			};
		}
		return {
			container: "h-10 gap-1",
			button: "px-4 py-2 text-sm font-medium",
			indicator: "rounded-lg",
		};
	}, [size]);

	return (
		<div
			className={`relative inline-flex items-center ${sizeStyles.container} bg-muted rounded-lg p-1 border border-border/20 ${fullWidth ? "w-full" : ""}`}
			role="group"
			aria-label={ariaLabel}
		>
			{/* Animated background indicator */}
			<motion.div
				className={`absolute inset-y-1 bg-background/80 backdrop-blur-sm border border-border/30 shadow-sm pointer-events-none ${sizeStyles.indicator}`}
				initial={false}
				animate={{
					x: `calc(${options.findIndex((o) => o.value === value) * 100}% + ${options.findIndex((o) => o.value === value) * (size === "small" ? 2 : 4)}px)`,
					width: `calc(${100 / options.length}% - ${size === "small" ? 4 : 8}px)`,
				}}
				transition={{
					type: "spring",
					stiffness: 380,
					damping: 30,
				}}
			/>

			{/* Option buttons */}
			{options.map((option) => (
				<motion.button
					key={option.value}
					onClick={() => !disabled && onChange(option.value)}
					disabled={disabled}
					className={`relative flex-1 ${sizeStyles.button} text-foreground/70 transition-colors z-10 ${
						value === option.value ? "text-foreground font-semibold" : ""
					} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-foreground/90"}`}
					whileHover={!disabled ? { scale: 1.02 } : {}}
					whileTap={!disabled ? { scale: 0.98 } : {}}
				>
					<div className="flex items-center justify-center gap-1.5">
						{option.icon && <span className="flex items-center justify-center">{option.icon}</span>}
						<span className="truncate">{option.label}</span>
					</div>
				</motion.button>
			))}
		</div>
	);
}
