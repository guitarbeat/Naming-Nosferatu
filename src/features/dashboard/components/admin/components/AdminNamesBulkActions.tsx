import { Eye, EyeOff, Lock } from "lucide-react";
import Button from "@/shared/components/layout/Button";
import type { BulkAction } from "./AdminNamesTab";

interface AdminNamesBulkActionsProps {
	selectedCount: number;
	onBulkAction: (action: BulkAction) => void;
	onClearSelection: () => void;
}

export function AdminNamesBulkActions({
	selectedCount,
	onBulkAction,
	onClearSelection,
}: AdminNamesBulkActionsProps) {
	if (selectedCount === 0) {
		return null;
	}

	return (
		<div className="mb-4 py-3 sm:py-4 border-y border-border/10">
			<p className="text-sm text-primary mb-2">{selectedCount} selected</p>
			<div className="flex flex-wrap gap-2">
				<Button onClick={() => onBulkAction("hide")} size="small">
					<EyeOff size={14} /> Hide
				</Button>
				<Button onClick={() => onBulkAction("unhide")} size="small">
					<Eye size={14} /> Unhide
				</Button>
				<Button onClick={() => onBulkAction("lock")} size="small">
					<Lock size={14} /> Lock
				</Button>
				<Button onClick={() => onBulkAction("unlock")} size="small">
					<Lock size={14} /> Unlock
				</Button>
				<Button onClick={onClearSelection} variant="ghost" size="small">
					Clear
				</Button>
			</div>
		</div>
	);
}
