import { PhotosIcon, ResultsIcon, AnalysisIcon } from "./icons";

// * Base nav definitions to keep the navbar DRY and data-driven
const NAV_DEFINITIONS = [
  {
    key: "gallery",
    label: "Gallery",
    shortLabel: "Photos",
    description: "Browse the latest community cat shots.",
    icon: PhotosIcon,
    ariaLabel: "Open cat photo gallery",
    isActive: ({ view }) => view === "photos",
    onSelect: ({ onOpenPhotos }) => onOpenPhotos?.(),
  },
  {
    key: "results",
    label: "Results & Winners",
    shortLabel: "Results",
    description: "See current standings and past champs.",
    icon: ResultsIcon,
    ariaLabel: "See completed tournament results",
    href: "/results",
    isActive: ({ currentRoute }) =>
      typeof currentRoute === "string" && currentRoute.startsWith("/results"),
    onSelect: ({ onNavigate }) => onNavigate?.("/results"),
  },
  {
    key: "analysis",
    label: "Analysis Mode",
    shortLabel: "Analysis",
    description: "Dive into matchup stats and trends.",
    icon: AnalysisIcon,
    ariaLabel: ({ isAnalysisMode }) =>
      isAnalysisMode ? "Disable analysis mode" : "Enable analysis mode",
    isActive: ({ isAnalysisMode }) => Boolean(isAnalysisMode),
    onSelect: ({ onToggleAnalysis }) => onToggleAnalysis?.(),
  },
];

/**
 * * Build navigation items with handlers and active state derived from context.
 * @param {Object} context - State and handlers the navbar needs.
 * @returns {Array} Configured navigation items ready for rendering.
 */
export function buildNavItems(context) {
  return NAV_DEFINITIONS.map((item) => {
    const ariaLabel =
      typeof item.ariaLabel === "function"
        ? item.ariaLabel(context)
        : item.ariaLabel;

    return {
      ...item,
      ariaLabel,
      isActive: item.isActive(context),
      onClick: () => item.onSelect?.(context),
    };
  });
}

export default buildNavItems;
