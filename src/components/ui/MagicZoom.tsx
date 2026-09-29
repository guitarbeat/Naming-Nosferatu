import { ZoomIn, ZoomOut } from "lucide-react";
import { memo } from "react";

interface MagicZoomProps {
	zoomLevel: number;
	handleZoomIn: () => void;
	handleZoomOut: () => void;
	handleResetZoom: () => void;
}

export const MagicZoom = memo(function MagicZoom({
	zoomLevel,
	handleZoomIn,
	handleZoomOut,
	handleResetZoom,
}: MagicZoomProps) {
	return (
		<div className="hidden sm:flex items-center rounded-xl border border-border/50 bg-muted/30 p-0.5 text-xs">
			<button
				type="button"
				onClick={handleZoomOut}
				className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
				title="Zoom out"
				aria-label="Zoom out"
			>
				<ZoomOut className="size-3.5" />
			</button>
			<button
				type="button"
				onClick={handleResetZoom}
				className="px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
				title="Reset zoom"
				aria-label="Reset zoom"
			>
				{Math.round(zoomLevel * 100)}%
			</button>
			<button
				type="button"
				onClick={handleZoomIn}
				className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
				title="Zoom in"
				aria-label="Zoom in"
			>
				<ZoomIn className="size-3.5" />
			</button>
		</div>
	);
});
