import { motion } from "framer-motion";
import { memo } from "react";
import { cn } from "@/shared/lib/utils";

export interface MagicToggleOption<T extends string> {
	value: T;
	label: string;
	icon?: React.ReactNode;
}

interface MagicToggleProps<T extends string> {
	options: readonly [MagicToggleOption<T>, MagicToggleOption<T>];
	value: T;
	onChange: (value: T) => void;
	className?: string;
	ariaLabel?: string;
}

function MagicToggleInner<T extends string>({
	options,
	value,
	onChange,
	className,
	ariaLabel,
}: MagicToggleProps<T>) {
	const activeIndex = options.findIndex((o) => o.value === value);

	return (
		<div
			className={cn(
				"relative inline-flex h-10 items-center rounded-full bg-muted/80 p-1 shadow-inner backdrop-blur-sm",
				className,
			)}
			role="radiogroup"
			aria-label={ariaLabel}
		>
			<motion.div
				className="absolute h-8 w-[calc(50%-4px)] rounded-full bg-background shadow-sm border border-border/50"
				animate={{
					left: activeIndex === 0 ? "4px" : "calc(50%)",
				}}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 30,
				}}
			/>
			{options.map((option, _index) => {
				const isActive = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isActive}
						onClick={() => onChange(option.value)}
						className={cn(
							"relative z-10 flex h-full flex-1 items-center justify-center gap-1.5 px-4 text-sm font-medium transition-colors select-none",
							isActive
								? "text-foreground"
								: "text-muted-foreground hover:text-foreground/80",
						)}
					>
						{option.icon && (
							<span
								className={cn(
									"flex items-center justify-center transition-transform",
									isActive ? "scale-100" : "scale-90",
								)}
							>
								{option.icon}
							</span>
						)}
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export const MagicToggle = memo(MagicToggleInner) as typeof MagicToggleInner;
