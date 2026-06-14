import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ChangeEvent } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";
import { SelectCombobox } from "@/shared/components/ui/SelectCombobox";

interface AdminNamesToolbarProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
}

export function AdminNamesToolbar({
	searchTerm,
	onSearchTermChange,
	filterStatus,
	filterOptions,
	onFilterChange,
	onRefresh,
}: AdminNamesToolbarProps) {
	return (
		<motion.div
			className="flex flex-col lg:flex-row gap-4 mb-6"
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex-1">
				<Input
					type="text"
					placeholder="Search names..."
					value={searchTerm}
					onChange={(event) => onSearchTermChange(event.target.value)}
					className="w-full"
				/>
			</div>
			<div className="flex gap-2">
				<div className="w-full max-w-xs">
					<SelectCombobox
						options={filterOptions}
						value={filterStatus}
						onChange={(value) =>
							onFilterChange({ target: { value } } as ChangeEvent<HTMLSelectElement>)
						}
						placeholder="Filter by status..."
						ariaLabel="Filter names by status"
					/>
				</div>

				<Button onClick={onRefresh} variant="ghost" size="small">
					<Loader2 size={16} />
				</Button>
			</div>
		</motion.div>
	);
}
