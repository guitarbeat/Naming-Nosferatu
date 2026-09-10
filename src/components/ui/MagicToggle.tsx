import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/lib/utils";

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
	size?: "small" | "default";
}

export function MagicToggle<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
	size = "default",
}: MagicToggleProps<T>) {
	return (
		<div
			className={`relative inline-flex items-center w-full sm:w-auto ${size === "small" ? "p-1" : "p-1.5"} bg-card backdrop-blur-md rounded-full border border-border/60 shadow-sm`}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${size === "small" ? "inset-y-1" : "inset-y-1.5"} rounded-full bg-primary/20 border border-primary/30 pointer-events-none`}
				initial={false}
				animate={{
					x: `calc(${options.findIndex((o) => o.value === value) * 100}% + ${options.findIndex((o) => o.value === value) * (size === "small" ? 2 : 4)}px)`,
					width: `calc(${100 / options.length}% - ${size === "small" ? 2 : 4}px)`,
				}}
				transition={{
					type: "spring",
					stiffness: 500,
					damping: 20,
					mass: 0.8,
				}}
			/>
			{options.map((option) => {
				const isSelected = value === option.value;
				return (
					<motion.button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={isSelected}
						onClick={() => {
							hapticNavTap();
							onChange(option.value);
						}}
						whileTap={{ scale: 0.95 }}
						className={`relative flex-1 ${size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-bold tracking-wide transition-colors z-10 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
							isSelected
								? "text-primary"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/30"
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							{option.icon && (
								<motion.span
									className="flex items-center justify-center"
									animate={{
										scale: isSelected ? [1, 1.15, 1] : 1,
									}}
									transition={{
										duration: 0.3,
										ease: "easeInOut",
									}}
								>
									{option.icon}
								</motion.span>
							)}
							<span>{option.label}</span>
						</div>
					</motion.button>
				);
			})}
		</div>
	);
}
