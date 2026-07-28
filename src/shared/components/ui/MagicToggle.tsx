import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/browser/haptics";

export interface MagicToggleOption<T extends string> {
	value: T;
	label: string;
	icon?: ReactNode;
	isAccent?: boolean;
	hasBadge?: boolean;
}

export interface MagicToggleProps<T extends string> {
	options: readonly MagicToggleOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel?: string;
	size?: "small" | "default";
	variant?: "default" | "floating";
}

export function MagicToggle<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
	size = "default",
	variant = "default",
}: MagicToggleProps<T>) {

	const isFloating = variant === "floating";
	const containerClasses = isFloating
		? `relative inline-flex items-center p-1.5 bg-slate-950/70 backdrop-blur-xl rounded-[1.75rem] border border-white/10 shadow-[0_8px_32px_rgba(2,8,18,0.4)] ring-1 ring-white/5 mx-auto max-w-full overflow-x-auto overflow-y-hidden hide-scrollbar`
		: `relative inline-flex items-center ${size === "small" ? "p-1" : "p-1.5"} bg-foreground/5 backdrop-blur-md ${size === "small" ? "rounded-xl" : "rounded-2xl"} border border-border/20 shadow-inner overflow-x-auto overflow-y-hidden hide-scrollbar`;

	return (
		<div
			className={containerClasses}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${isFloating ? "inset-y-1.5 rounded-[1.25rem] bg-white/10 border-white/20 shadow-[0_2px_12px_rgba(255,255,255,0.08)]" : size === "small" ? "inset-y-1 rounded-lg bg-primary/15 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "inset-y-1.5 rounded-xl bg-primary/15 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]"} border pointer-events-none`}
				initial={false}
				animate={{
					x: `calc(${options.findIndex((o) => o.value === value) * 100}% + ${options.findIndex((o) => o.value === value) * (size === "small" && !isFloating ? 2 : 4)}px)`,
					width: `calc(${100 / options.length}% - ${size === "small" && !isFloating ? 2 : 4}px)`,
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
				const isAccent = option.isAccent;

				const buttonClasses = isFloating
					? `relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 min-w-[4rem] sm:min-w-0 transition-colors z-10 rounded-[1.25rem] ${isSelected ? "text-white" : isAccent ? "text-primary hover:text-primary-foreground" : "text-white/60 hover:text-white/90"}`
					: `relative flex-1 ${size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-bold tracking-wide transition-colors z-10 ${size === "small" ? "rounded-lg" : "rounded-xl"} ${isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"}`;

				return (
					<motion.button
						key={option.value}
						role="tab"
						aria-selected={isSelected}
						onClick={() => {
							hapticNavTap();
							onChange(option.value);
						}}
						className={buttonClasses}
						whileHover={{ scale: isFloating ? 1.05 : 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
							{option.icon && (
								<span className="flex items-center justify-center relative">
									{option.icon}
									{option.hasBadge && (
										<span className="absolute -top-1 -right-1 flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
											<span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
										</span>
									)}
								</span>
							)}
							<span className={isFloating ? "text-[10px] sm:text-xs font-semibold tracking-wide" : ""}>{option.label}</span>
						</div>
					</motion.button>
				);
			})}
		</div>
	);
}
