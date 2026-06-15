import type { ChangeEvent } from "react";
import { AdminNameRow } from "./AdminNameRow";
import { AdminNamesBulkActions } from "./AdminNamesBulkActions";
import { AdminNamesToolbar } from "./AdminNamesToolbar";
import type { BulkAction, NameWithStats } from "./AdminNamesTypes";

interface AdminNamesTabProps {
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	filterStatus: string;
	filterOptions: readonly { value: string; label: string }[];
	onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
	onRefresh: () => void;
	selectedNames: ReadonlySet<string>;
	onBulkAction: (action: BulkAction) => void;
	onClearSelection: () => void;
	filteredNames: NameWithStats[];
	onSelectionChange: (nameId: string, checked: boolean) => void;
	onToggleHidden: (nameId: string | number, isHidden: boolean) => void;
	onToggleLocked: (nameId: string | number, isLocked: boolean) => void;
	onDelete: (nameId: string | number) => void;
}

export function AdminNamesTab({
	searchTerm,
	onSearchTermChange,
	filterStatus,
	filterOptions,
	onFilterChange,
	onRefresh,
	selectedNames,
	onBulkAction,
	onClearSelection,
	filteredNames,
	onSelectionChange,
	onToggleHidden,
	onToggleLocked,
	onDelete,
}: AdminNamesTabProps) {
	return (
		<>
			<AdminNamesToolbar
				searchTerm={searchTerm}
				onSearchTermChange={onSearchTermChange}
				filterStatus={filterStatus}
				filterOptions={filterOptions}
				onFilterChange={onFilterChange}
				onRefresh={onRefresh}
			/>

			<AdminNamesBulkActions
				selectedCount={selectedNames.size}
				onBulkAction={onBulkAction}
				onClearSelection={onClearSelection}
			/>

			<div className="divide-y divide-border/10">
				{filteredNames.map((name) => (
					<AdminNameRow
						key={name.id}
						name={name}
						isSelected={selectedNames.has(String(name.id))}
						onSelectionChange={onSelectionChange}
						onToggleHidden={onToggleHidden}
						onToggleLocked={onToggleLocked}
						onDelete={onDelete}
					/>
				))}
			</div>
		</>
	);
}
