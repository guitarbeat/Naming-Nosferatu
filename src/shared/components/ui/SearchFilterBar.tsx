import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import type { ChangeEvent } from "react";
import Button from "@/shared/components/layout/Button";

interface SearchFilterBarProps {
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
		if ("vibrate" in navigator) {
			navigator.vibrate(50);
		}
		onRefresh();
	};

	return (
		<motion.div
			className="flex flex-col sm:flex-row items-center gap-3 w-full bg-foreground/5 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-border/10 shadow-inner group transition-all duration-300 hover:border-border/30 hover:shadow-md mb-6"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
			animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			transition={{
				duration: 0.3,
				type: "spring",
				stiffness: 300,
				damping: 25,
			}}
		>
			<div className="flex-1 w-full relative">
				<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary">
					<Search size={16} />
				</div>
				<input
					type="text"
					placeholder="Search names..."
					value={searchTerm}
					onChange={handleSearchChange}
					aria-label="Search names"
					className="w-full h-11 bg-background/40 hover:bg-background/60 focus:bg-background/80 transition-colors rounded-xl pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/70 border-none outline-none ring-0 focus:ring-2 focus:ring-primary/40"
				/>
				{searchTerm.length > 0 && (
					<button
						type="button"
						onClick={() => onSearchTermChange("")}
						className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95"
						aria-label="Clear search"
						title="Clear search"
					>
						<X size={14} />
					</button>
				)}
			</div>
			<div className="flex items-center gap-2 w-full sm:w-auto">
				<div className="relative w-full sm:w-40 h-11 bg-background/40 hover:bg-background/60 focus-within:bg-background/80 transition-colors rounded-xl flex items-center px-3 border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
					<select
						value={filterStatus}
						onChange={onFilterChange}
						aria-label="Filter names by status"
						className="w-full bg-transparent text-sm text-foreground appearance-none outline-none cursor-pointer"
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
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
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
					className="h-11 w-11 sm:w-11 p-0 shrink-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
					aria-label="Refresh list"
					title="Refresh list"
				>
					<Loader2 size={18} />
				</Button>
			</div>
		</motion.div>
	);
}
