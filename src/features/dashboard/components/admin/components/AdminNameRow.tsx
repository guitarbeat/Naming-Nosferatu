import { Eye, EyeOff, Lock, Trash2 } from "lucide-react";
import Button from "@/shared/components/layout/Button";
import { isNameHidden, isNameLocked } from "@/shared/lib/names/nameFilters";
import type { NameWithStats } from "./AdminNamesTypes";

interface AdminNameRowProps {
	name: NameWithStats;
	isSelected: boolean;
	onSelectionChange: (nameId: string, checked: boolean) => void;
	onToggleHidden: (nameId: string | number, isHidden: boolean) => void;
	onToggleLocked: (nameId: string | number, isLocked: boolean) => void;
	onDelete: (nameId: string | number) => void;
}

export function AdminNameRow({
	name,
	isSelected,
	onSelectionChange,
	onToggleHidden,
	onToggleLocked,
	onDelete,
}: AdminNameRowProps) {
	const nameId = String(name.id);
	const hidden = isNameHidden(name);
	const locked = isNameLocked(name);

	return (
		<div className="py-3 sm:py-4">
			<div className="flex items-start sm:items-center justify-between gap-2">
				<div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
					<input
						type="checkbox"
						checked={isSelected}
						onChange={(event) => onSelectionChange(nameId, event.target.checked)}
						className="w-4 h-4 mt-1 sm:mt-0 shrink-0"
					/>
					<div className="min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-semibold text-foreground text-sm sm:text-base">{name.name}</h3>
							{locked && (
								<span className="text-[10px] text-chart-4 font-semibold inline-flex items-center gap-0.5">
									<Lock size={10} /> Locked
								</span>
							)}
							{hidden && (
								<span className="text-[10px] text-destructive font-semibold inline-flex items-center gap-0.5">
									<EyeOff size={10} /> Hidden
								</span>
							)}
						</div>
						{name.description && (
							<p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
								{name.description}
							</p>
						)}
						<div className="flex gap-3 mt-0.5 text-[10px] sm:text-xs text-muted-foreground/60">
							<span>Votes: {name.votes}</span>
							<span>
								Score: {name.popularityScore == null ? "?" : name.popularityScore.toFixed(1)}
							</span>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-1 shrink-0">
					<Button
						onClick={() => onToggleHidden(name.id, hidden)}
						variant="ghost"
						size="small"
						aria-label={hidden ? "Unhide name" : "Hide name"}
					>
						{hidden ? <Eye size={14} /> : <EyeOff size={14} />}
					</Button>
					<Button
						onClick={() => onToggleLocked(name.id, locked)}
						variant="ghost"
						size="small"
						aria-label={locked ? "Unlock name" : "Lock name"}
					>
						<Lock size={14} />
					</Button>
					<Button
						onClick={() => onDelete(name.id)}
						variant="ghost"
						size="small"
						aria-label="Delete name"
						className="text-destructive hover:text-destructive"
					>
						<Trash2 size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
}
