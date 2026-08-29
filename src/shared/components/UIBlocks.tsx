import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { type ChangeEvent, memo, type ReactNode } from "react";
import { Button, Loading } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";

export * from "./FloatingNav";
export * from "./ProfileWidget";

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
			className={`relative inline-flex items-center w-full sm:w-auto ${size === "small" ? "p-1" : "p-1.5"} bg-white/5 dark:bg-black/40 backdrop-blur-xl ${size === "small" ? "rounded-xl" : "rounded-2xl"} border border-white/10 shadow-xl`}
			role="tablist"
			aria-label={ariaLabel}
		>
			<motion.div
				className={`absolute ${size === "small" ? "inset-y-1 rounded-md" : "inset-y-1.5 rounded-lg"} bg-primary/20 border border-primary/30 pointer-events-none`}
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
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={isSelected}
						onClick={() => {
							hapticNavTap();
							onChange(option.value);
						}}
						className={`relative flex-1 ${size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm"} font-semibold tracking-wide transition-colors z-10 ${size === "small" ? "rounded-md" : "rounded-lg"} ${
							isSelected
								? "text-primary-foreground font-bold"
								: "text-muted-foreground hover:text-foreground"
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
					</button>
				);
			})}
		</div>
	);
}

export interface SearchFilterBarProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
}

export function SearchFilterBar({
	searchTerm,
	onSearchTermChange,
	filterStatus,
	filterOptions,
	onFilterChange,
	onRefresh,
}: SearchFilterBarProps) {
	const prefersReducedMotion = useReducedMotion();

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
		onSearchTermChange(event.target.value);
	};

	const handleRefresh = () => {
		hapticNavTap();
		onRefresh();
	};

	return (
		<motion.div
			className="flex flex-col sm:flex-row items-center gap-2 w-full bg-background/40 backdrop-blur-md rounded-2xl p-1.5 sm:p-2 border border-border/10 shadow-inner group transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(var(--primary),0.15)] focus-within:bg-background/60 mb-6"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
			animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			transition={{
				duration: 0.3,
				type: "spring",
				stiffness: 300,
				damping: 25,
			}}
		>
			<div className="flex-1 w-full relative flex items-center min-w-0">
				<div className="pl-4 pr-3 text-muted-foreground transition-colors group-focus-within:text-primary">
					<Search size={18} />
				</div>
				<input
					type="text"
					placeholder="Search names..."
					value={searchTerm}
					onChange={handleSearchChange}
					aria-label="Search names"
					className="w-full h-12 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground border-none outline-none ring-0 min-w-0"
				/>
			</div>

			<div className="w-px h-8 bg-border/20 hidden sm:block mx-1" />

			<div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-border/10 sm:border-t-0 shrink-0 px-2 sm:px-0 pb-1 sm:pb-0">
				<div className="relative">
					<select
						value={filterStatus}
						onChange={onFilterChange}
						aria-label="Filter names by status"
						className="h-10 bg-foreground/5 hover:bg-foreground/10 transition-colors rounded-xl px-4 pr-10 text-sm font-medium text-foreground appearance-none outline-none cursor-pointer border border-transparent focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
					>
						{filterOptions.map((option) => (
							<option
								key={option.value}
								value={option.value}
								className="bg-background text-foreground"
							>
								{option.label}
							</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
						<svg
							className="h-4 w-4 fill-current"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							aria-hidden="true"
						>
							<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
						</svg>
					</div>
				</div>

				<Button
					onClick={handleRefresh}
					variant="primary"
					className="h-10 w-10 sm:w-10 p-0 shrink-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
					aria-label="Refresh list"
					title="Refresh list"
				>
					<Loader2 size={16} />
				</Button>
			</div>
		</motion.div>
	);
}

export function RouteFallback({ text }: { text: string }) {
	return <Loading variant="cat-gif" text={text} className="min-h-[82dvh]" />;
}

export const SectionHeading = memo(function SectionHeading({
	id,
	title,
	subtitle,
}: {
	id?: string;
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="mx-auto mb-6 flex w-full max-w-2xl flex-col items-center text-center sm:mb-8">
			<h2
				id={id}
				className="font-display font-bold leading-[0.96] tracking-[-0.03em] text-foreground"
			>
				{title}
			</h2>
			{subtitle && (
				<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
					{subtitle}
				</p>
			)}
		</div>
	);
});
