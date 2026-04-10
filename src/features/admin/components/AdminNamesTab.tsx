import type { ChangeEvent } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";
import { isNameHidden, isNameLocked } from "@/shared/lib/basic";
import { Eye, EyeOff, Loader2, Lock, Trash2 } from "@/shared/lib/icons";
import type { NameItem } from "@/shared/types";

type NameWithStats = NameItem & {
	votes?: number;
	popularityScore?: number;
};

type BulkAction = "hide" | "unhide" | "lock" | "unlock";

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
			<div className="flex flex-col lg:flex-row gap-4 mb-6">
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
					<select
						value={filterStatus}
						onChange={onFilterChange}
						className="px-4 py-2 bg-foreground/10 border border-border/20 rounded-lg text-foreground"
					>
						{filterOptions.map((option) => (
							<option value={option.value} key={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<Button onClick={onRefresh} variant="ghost" size="small">
						<Loader2 size={16} />
					</Button>
				</div>
			</div>

			{selectedNames.size > 0 && (
				<div className="mb-4 py-3 sm:py-4 border-y border-border/10">
					<p className="text-sm text-primary mb-2">{selectedNames.size} selected</p>
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
			)}

			<div className="divide-y divide-border/10">
				{filteredNames.map((name) => {
					const nameId = String(name.id);
					const hidden = isNameHidden(name);
					const locked = isNameLocked(name);

					return (
						<div key={name.id} className="py-3 sm:py-4">
							<div className="flex items-start sm:items-center justify-between gap-2">
								<div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
									<input
										type="checkbox"
										checked={selectedNames.has(nameId)}
										onChange={(event) => onSelectionChange(nameId, event.target.checked)}
										className="w-4 h-4 mt-1 sm:mt-0 shrink-0"
									/>
									<div className="min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<h3 className="font-semibold text-foreground text-sm sm:text-base">
												{name.name}
											</h3>
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
												Score:{" "}
												{name.popularityScore == null ? "?" : name.popularityScore.toFixed(1)}
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
				})}
			</div>
		</>
	);
}
