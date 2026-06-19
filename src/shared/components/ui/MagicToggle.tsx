import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/browser/haptics";

export interface MagicToggleOption<T extends string> {
	value: T;
	label: string;
	icon?: ReactNode;
}

export interface MagicToggleProps<T extends string> {
	options: readonly MagicToggleOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel?: string;
	size?: "small" | "medium";
	fullWidth?: boolean;
	disabled?: boolean;
}

export function MagicToggle<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
	size = "medium",
	fullWidth = false,
	disabled = false,
}: MagicToggleProps<T>) {
	const isSmall = size === "small";

	return (
		<div
			className={`relative inline-flex items-center ${isSmall ? "p-1 rounded-xl" : "p-1.5 rounded-2xl"} bg-foreground/5 backdrop-blur-md border border-border/20 shadow-inner ${fullWidth ? "w-full flex" : ""}`}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${isSmall ? "inset-y-1 rounded-lg" : "inset-y-1.5 rounded-xl"} bg-primary/15 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)] pointer-events-none`}
				initial={false}
				animate={{
					x: `calc(${options.findIndex((o) => o.value === value) * 100}% + ${options.findIndex((o) => o.value === value) * (isSmall ? 4 : 4)}px)`,
					width: `calc(${100 / options.length}% - ${isSmall ? 8 : 4}px)`,
				}}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 25,
					mass: 0.8,
				}}
			/>
			{options.map((option) => {
				const isSelected = value === option.value;
				return (
					<motion.button
						key={option.value}
						role="tab"
						aria-selected={isSelected}
						disabled={disabled}
						onClick={() => {
							if (!disabled) {
								hapticNavTap();
								onChange(option.value);
							}
						}}
						className={`relative flex-1 ${isSmall ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-bold tracking-wide transition-colors z-10 ${isSmall ? "rounded-lg" : "rounded-xl"} ${
							isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"
						} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
						whileHover={disabled ? {} : { scale: 1.05 }}
						whileTap={disabled ? {} : { scale: 0.95 }}
					>
						<div className="flex items-center justify-center gap-1.5 sm:gap-2">
							{option.icon && (
								<span className="flex items-center justify-center">{option.icon}</span>
							)}
							<span className="truncate">{option.label}</span>
						</div>
					</motion.button>
				);
			})}
		</div>
	);
}
