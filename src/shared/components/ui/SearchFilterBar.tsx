import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import Button from "@/shared/components/layout/Button";
import { MagicToggle } from "./MagicToggle";

interface SearchFilterBarProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
}

function SearchInput({
	searchTerm,
	onChange,
}: {
	searchTerm: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="flex-1 w-full relative">
			<div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary">
				<Search size={16} />
			</div>
			<input
				type="text"
				placeholder="Search names..."
				value={searchTerm}
				onChange={onChange}
				aria-label="Search names"
				className="w-full h-11 bg-background/40 hover:bg-background/60 focus:bg-background/80 transition-colors rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 border-none outline-none ring-0 focus:ring-2 focus:ring-primary/40"
			/>
		</div>
	);
}

function FilterSelect({
	filterStatus,
	filterOptions,
	onChange,
}: {
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
	return (
		<div className="relative w-full sm:w-auto h-11 flex items-center">
			<MagicToggle
				options={filterOptions as any}
				value={filterStatus}
				onChange={(value) => {
					onChange({ target: { value } } as unknown as ChangeEvent<HTMLSelectElement>);
				}}
				ariaLabel="Filter names by status"
				size="small"
			/>
		</div>
	);
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
			<SearchInput searchTerm={searchTerm} onChange={handleSearchChange} />
			<div className="flex items-center gap-2 w-full sm:w-auto">
				<FilterSelect
					filterStatus={filterStatus}
					filterOptions={filterOptions}
					onChange={onFilterChange}
				/>
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
