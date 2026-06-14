import { isNameHidden, isNameLocked } from "@/shared/lib/names/nameFilters";
import type { IdType, NameItem } from "@/shared/types";
import { AdminActionButton } from "./AdminActionButton";

interface AdminActionsPanelProps {
	nameItem: NameItem;
	isAdmin: boolean;
	togglingHidden: Set<IdType>;
	togglingLocked: Set<IdType>;
	onToggleHidden: (nameId: IdType, isCurrentlyEnabled: boolean) => void;
	onToggleLocked: (nameId: IdType, isCurrentlyEnabled: boolean) => void;
}

export function AdminActionsPanel({
	nameItem,
	isAdmin,
	togglingHidden,
	togglingLocked,
	onToggleHidden,
	onToggleLocked,
}: AdminActionsPanelProps) {
	if (!isAdmin) {
		return null;
	}

	return (
		<div className="absolute inset-x-0 bottom-0 p-3 bg-background/95 backdrop-blur-md border-t border-border/10 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
			<AdminActionButton
				nameItem={nameItem}
				actionType="toggle-hidden"
				isProcessing={togglingHidden.has(nameItem.id)}
				onClick={() => onToggleHidden(nameItem.id, isNameHidden(nameItem))}
			/>
			<AdminActionButton
				nameItem={nameItem}
				actionType="toggle-locked"
				isProcessing={togglingLocked.has(nameItem.id)}
				onClick={() => onToggleLocked(nameItem.id, isNameLocked(nameItem))}
			/>
		</div>
	);
}
