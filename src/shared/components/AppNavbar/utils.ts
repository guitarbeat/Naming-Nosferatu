import { AnalysisIcon, PhotosIcon } from "./components/Icons";
import type { NavItem, ViewType } from "./types";

export interface BuildNavItemsContext {
	view: ViewType;
	isAnalysisMode: boolean;
	onOpenPhotos?: () => void;
	onToggleAnalysis: () => void;
}

export function buildNavItems(context: BuildNavItemsContext): NavItem[] {
	const { view, isAnalysisMode, onOpenPhotos, onToggleAnalysis } = context;

	return [
		{
			key: "gallery",
			label: "Gallery",
			shortLabel: "Photos",
			icon: PhotosIcon,
			ariaLabel: "Open cat photo gallery",
			isActive: view === "photos",
			onClick: () => onOpenPhotos?.(),
		},
		{
			key: "analysis",
			label: "Analysis Mode",
			shortLabel: "Analysis",
			icon: AnalysisIcon,
			ariaLabel: isAnalysisMode
				? "Disable analysis mode"
				: "Enable analysis mode",
			isActive: Boolean(isAnalysisMode),
			onClick: () => onToggleAnalysis(),
		},
	];
}
