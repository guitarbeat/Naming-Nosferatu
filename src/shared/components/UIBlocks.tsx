import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { type ChangeEvent, memo } from "react";
import { MagicToggle } from "@/components/ui/MagicToggle";
import { Button, Input, Loading } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";

export * from "./FloatingNav";
export * from "./ProfileWidget";

export interface SearchFilterBarProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (value: string) => void;
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
				<div className="absolute left-0 pl-4 pr-3 text-muted-foreground transition-colors group-focus-within:text-primary z-20 pointer-events-none">
					<Search size={18} />
				</div>
				<Input
					type="text"
					placeholder="Search names..."
					value={searchTerm}
					onChange={handleSearchChange}
					aria-label="Search names"
					className="w-full pl-11 pr-10 bg-transparent border-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-transparent text-sm sm:text-base text-foreground"
				/>
				{searchTerm ? (
					<button
						type="button"
						onClick={() => {
							hapticNavTap();
							onSearchTermChange("");
						}}
						aria-label="Clear search"
						title="Clear search"
						className="absolute right-2 z-20 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						<X size={16} className="pointer-events-none" />
					</button>
				) : null}
			</div>

			<div className="w-px h-8 bg-border/20 hidden sm:block mx-1" />

			<div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-border/10 sm:border-t-0 shrink-0 px-2 sm:px-0 pb-1 sm:pb-0">
				<MagicToggle
					options={filterOptions}
					value={filterStatus}
					onChange={onFilterChange}
					ariaLabel="Filter names by status"
					size="small"
				/>

				<Button
					onClick={handleRefresh}
					variant="primary"
					className="h-9 w-9 sm:w-9 p-0 shrink-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
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
