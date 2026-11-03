import { memo } from "react";
import { MagicSearch } from "./MagicSearch";
import { MagicToggle } from "./MagicToggle";

export interface MagicToolbarProps {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	viewMode: "tree" | "cards";
	setViewMode: (mode: "tree" | "cards") => void;
}

export const MagicToolbar = memo(function MagicToolbar({
	searchQuery,
	setSearchQuery,
	viewMode,
	setViewMode,
}: MagicToolbarProps) {
	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
			<MagicToggle viewMode={viewMode} setViewMode={setViewMode} />
			<div className="hidden sm:block w-px h-6 bg-border/40" />
			<MagicSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
		</div>
	);
});
