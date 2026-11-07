import { ZoomIn, ZoomOut } from "lucide-react";
import { memo } from "react";

export interface MagicZoomProps {
	zoom: number;
	setZoom: (z: number | ((prev: number) => number)) => void;
}

export const MagicZoom = memo(function MagicZoom({ zoom, setZoom }: MagicZoomProps) {
	return (
		<div className="group relative flex h-8 items-center rounded-xl border border-border/60 bg-white/40 dark:bg-black/40 px-1 backdrop-blur-md transition-all duration-300 hover:bg-white/60 dark:hover:bg-black/60">
			<button
				type="button"
				onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
				className="flex size-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-95"
				title="Zoom Out"
				aria-label="Zoom Out"
			>
				<ZoomOut className="size-3.5" />
			</button>
			<div className="flex w-0 items-center justify-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:w-12 group-hover:opacity-100">
				<span className="font-mono text-[10px] font-medium text-foreground whitespace-nowrap">
					{Math.round(zoom * 100)}%
				</span>
			</div>
			<button
				type="button"
				onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
				className="flex size-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground active:scale-95"
				title="Zoom In"
				aria-label="Zoom In"
			>
				<ZoomIn className="size-3.5" />
			</button>
		</div>
	);
});
