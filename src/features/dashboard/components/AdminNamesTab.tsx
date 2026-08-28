import { Eye, EyeOff, Lock, Trash2, Unlock } from "lucide-react";
import { Button, SearchFilterBar } from "@/shared/components";
import { isNameHidden, isNameLocked } from "@/shared/lib/names";
import type { AdminNamesTabProps, NameWithStats } from "../types";

function AdminNameItem({
	name,
	onToggleHidden,
	onToggleLocked,
	onDelete,
}: {
	name: NameWithStats;
	onToggleHidden: (nameId: string | number, isHidden: boolean) => void;
	onToggleLocked: (nameId: string | number, isLocked: boolean) => void;
	onDelete: (nameId: string | number) => void;
}) {
	const hidden = isNameHidden(name);
	const locked = isNameLocked(name);

	return (
		<div className="group flex items-center justify-between gap-3 p-3 sm:p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<h4 className="font-display text-sm sm:text-base font-bold text-foreground truncate">
							{name.name}
						</h4>
						{locked && (
							<span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
								<Lock size={10} /> Locked
							</span>
						)}
						{hidden && (
							<span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
								<EyeOff size={10} /> Hidden
							</span>
						)}
					</div>
					{name.description && (
						<p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{name.description}</p>
					)}
					<div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground/70">
						<span>
							Votes: <strong className="text-foreground/80">{name.votes ?? 0}</strong>
						</span>
						<span>&middot;</span>
						<span>
							Score:{" "}
							<strong className="text-foreground/80">
								{name.popularityScore == null ? "—" : name.popularityScore.toFixed(1)}
							</strong>
						</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-1 shrink-0">
				<Button
					onClick={() => onToggleHidden(name.id, hidden)}
					variant="ghost"
					size="small"
					iconOnly={true}
					aria-label={hidden ? "Unhide name" : "Hide name"}
					title={hidden ? "Unhide name" : "Hide name"}
				>
					{hidden ? <Eye size={15} /> : <EyeOff size={15} />}
				</Button>
				<Button
					onClick={() => onToggleLocked(name.id, locked)}
					variant="ghost"
					size="small"
					iconOnly={true}
					aria-label={locked ? "Unlock name" : "Lock name"}
					title={locked ? "Unlock name" : "Lock name"}
				>
					{locked ? <Unlock size={15} /> : <Lock size={15} />}
				</Button>
				<Button
					onClick={() => onDelete(name.id)}
					variant="ghost"
					size="small"
					iconOnly={true}
					aria-label="Delete name"
					title="Delete name"
					className="text-destructive hover:text-destructive hover:bg-destructive/10"
				>
					<Trash2 size={15} />
				</Button>
			</div>
		</div>
	);
}

export function AdminNamesTab({
	searchTerm,
	onSearchTermChange,
	filterStatus,
	filterOptions,
	onFilterChange,
	onRefresh,
	filteredNames,
	onToggleHidden,
	onToggleLocked,
	onDelete,
}: AdminNamesTabProps) {
	return (
		<div className="space-y-4">
			<SearchFilterBar
				searchTerm={searchTerm}
				onSearchTermChange={onSearchTermChange}
				filterStatus={filterStatus}
				filterOptions={filterOptions}
				onFilterChange={onFilterChange}
				onRefresh={onRefresh}
			/>

			<div className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 divide-y divide-border/20 shadow-sm backdrop-blur-sm">
				{filteredNames.length > 0 ? (
					filteredNames.map((name) => (
						<AdminNameItem
							key={name.id}
							name={name}
							onToggleHidden={onToggleHidden}
							onToggleLocked={onToggleLocked}
							onDelete={onDelete}
						/>
					))
				) : (
					<div className="p-8 text-center text-sm text-muted-foreground">
						No cat names match the selected filter.
					</div>
				)}
			</div>
		</div>
	);
}
